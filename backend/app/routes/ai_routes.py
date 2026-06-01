from datetime import date
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.resume import Resume
from app.services.ai_service import generate_summary, generate_experience_description, generate_project_description
from app.services.agent_service import handle_agent_message
import os
import json

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/agent", methods=["POST"])
@jwt_required()
def ai_agent():
    try:
        user_id = get_jwt_identity()
        data = request.get_json(force=True, silent=True) or {}
        message = data.get("message", "")
        resume_id = data.get("resume_id")
        conversation_history = data.get("conversation_history", [])
        context = data.get("context", {})
        context = {**context, "confirm_action": bool(data.get("confirm_action")), "pending_changes": data.get("pending_changes") or context.get("pending_changes")}

        result = handle_agent_message(
            user_id=user_id,
            message=message,
            resume_id=resume_id,
            conversation_history=conversation_history,
            context=context,
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "message": "AI agent failed to process the request.",
            "actions_taken": [],
            "data": {"error": str(e)}
        }), 500

@ai_bp.route("/generate-summary/<int:resume_id>", methods=["GET"])
@jwt_required()
def ai_generate_summary(resume_id):   
    user_id = get_jwt_identity()

    resume = Resume.query.filter_by(id=resume_id, user_id=int(user_id)).first()
    if not resume:  # pragma: no cover
        return jsonify({"error": "Resume not found"}), 404

    summary = generate_summary({
        "full_name": resume.full_name or "",
        "professional_title": resume.professional_title or ""
    })
    
    return jsonify({"ai_generated_summary": summary}), 200

@ai_bp.route("/generate-experience", methods=["POST"])
@jwt_required()
def ai_generate_experience():
    data = request.get_json()
    if not data.get("role") or not data.get("company"):  # pragma: no cover
        return jsonify({"error": "role and company are required"}), 400

    description = generate_experience_description({
        "role": data.get("role"),
        "company": data.get("company"),
        "start_date": data.get("start_date", ""),
        "end_date": data.get("end_date", "Present")
    })
    return jsonify({"description": description}), 200

@ai_bp.route("/generate-project", methods=["POST"])
@jwt_required()
def ai_generate_project():
    data = request.get_json()
    if not data.get("title"):  # pragma: no cover
        return jsonify({"error": "title is required"}), 400

    description = generate_project_description({
        "title": data.get("title"),
        "tech_stack": data.get("tech_stack", "")
    })
    return jsonify({"description": description}), 200

###################AI ANALYZE RESUME#####################
@ai_bp.route("/analyze-resume", methods=["POST"])
@jwt_required()
def analyze_resume():
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        resume_text = str(data.get("resume_text", "")).strip()
        job_description = str(data.get("job_description", "")).strip()

        if not resume_text or len(resume_text) < 50:
            return jsonify({"error": "resume_text is required"}), 400

        jd_section = f"\n\nJob Description to match against:\n{job_description}" if job_description else ""

        prompt = f"""You are an expert ATS resume consultant. Analyze this resume and provide 5 specific actionable improvements.{jd_section}

Resume:
{resume_text}

Respond ONLY in this exact JSON with no extra text:
{{
  "improvements": [
    {{"title": "title", "detail": "specific action", "impact": "high"}},
    {{"title": "title", "detail": "specific action", "impact": "medium"}},
    {{"title": "title", "detail": "specific action", "impact": "high"}},
    {{"title": "title", "detail": "specific action", "impact": "low"}},
    {{"title": "title", "detail": "specific action", "impact": "medium"}}
  ],
  "summary": "2-sentence assessment."
}}"""

        from groq import Groq
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.3,
        )
        text = completion.choices[0].message.content.strip()
        clean = text.replace("```json", "").replace("```", "").strip()
        start = clean.find("{")
        end = clean.rfind("}") + 1
        if start != -1 and end > start:
            clean = clean[start:end]
        result = json.loads(clean)
        return jsonify(result), 200

    except json.JSONDecodeError:
        return jsonify({
            "improvements": [{"title": "Try Again", "detail": "AI could not parse the response. Please try again.", "impact": "medium"}],
            "summary": "Analysis incomplete."
        }), 200
    except Exception as e:
        print(f"❌ analyze-resume error: {str(e)}")
        return jsonify({"error": f"AI analysis failed: {str(e)}"}), 500
