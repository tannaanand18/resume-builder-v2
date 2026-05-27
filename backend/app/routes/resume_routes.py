from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.resume import Resume
from app.models.education import Education
from app.models.experience import Experience
from app.models.skills import Skill
from app.models.project import Project
from app.models.certification import Certification
from app.services.pdf_service import generate_resume_pdf

resume_bp = Blueprint("resume", __name__)


@resume_bp.route("/", methods=["POST"])
@jwt_required()
def create_resume():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        VALID_TEMPLATES = {'simple', 'modern', 'creative'}
        TEMPLATE_MAP = {
            'obsidian': 'creative', 'finance': 'simple', 'corporate': 'simple',
            'annafield': 'simple', 'harvard': 'simple', 'atlantic': 'modern',
            'classic': 'simple', 'sidebar': 'modern', 'minimal': 'simple',
            'meghana': 'modern', 'simplyblue': 'simple',
        }

        template_name = data.get('template_name', 'simple')
        if template_name not in VALID_TEMPLATES:
            template_name = TEMPLATE_MAP.get(template_name, 'simple')

        template_style = data.get('template_style', None)

        new_resume = Resume(
            user_id=int(user_id),
            title=data.get("title", "Untitled Resume"),
            summary=data.get("summary"),
            template_name=template_name,
            template_style=template_style
        )

        db.session.add(new_resume)
        db.session.commit()

        return jsonify({
            "message": "Resume created successfully",
            "resume_id": new_resume.id,
            "template_name": template_name,
            "template_style": template_style
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create resume", "details": str(e)}), 500


@resume_bp.route("/", methods=["GET"])
@resume_bp.route("/all", methods=["GET"])
@jwt_required()
def get_resumes():
    try:
        user_id = get_jwt_identity()
        resumes = Resume.query.filter_by(user_id=int(user_id)).all()

        return jsonify([
            {
                "id": r.id,
                "title": r.title,
                "summary": r.summary,
                "template_name": r.template_name,
                "template_style": r.template_style,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None
            } for r in resumes
        ]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# PUBLIC RESUME VIEW (no auth required)
# Used by ResumeView.jsx at /resume/:id/view
# ============================================
@resume_bp.route("/public/<int:resume_id>", methods=["GET"])
def get_public_resume(resume_id):
    try:
        resume = Resume.query.filter_by(id=resume_id).first()
        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        experiences = Experience.query.filter_by(resume_id=resume_id).all()
        educations  = Education.query.filter_by(resume_id=resume_id).all()
        skills      = Skill.query.filter_by(resume_id=resume_id).all()
        projects    = Project.query.filter_by(resume_id=resume_id).all()
        certs       = Certification.query.filter_by(resume_id=resume_id).all()

        return jsonify({
            "resume": resume.to_dict(),
            "experiences": [
                {
                    "id": e.id,
                    "resume_id": e.resume_id,
                    "company": e.company,
                    "role": e.role,
                    "description": e.description,
                    "start_date": e.start_date,
                    "end_date": e.end_date,
                } for e in experiences
            ],
            "educations": [
                {
                    "id": e.id,
                    "resume_id": e.resume_id,
                    "degree": e.degree,
                    "institution": e.institution,
                    "start_year": e.start_year,
                    "end_year": e.end_year,
                    "score": e.score,
                } for e in educations
            ],
            # ── Map skill_name → name for frontend ──
            "skills": [
                {
                    "id": s.id,
                    "resume_id": s.resume_id,
                    "name": s.skill_name,
                    "level": s.level,
                } for s in skills
            ],
            # ── Map project_title → title for frontend ──
            "projects": [
                {
                    "id": p.id,
                    "resume_id": p.resume_id,
                    "title": p.project_title,
                    "description": p.description,
                    "tech_stack": p.tech_stack,
                    "link": p.link,
                } for p in projects
            ],
            # ── Map certification fields for frontend ──
            "certs": [
                {
                    "id": c.id,
                    "resume_id": c.resume_id,
                    "name": c.title,
                    "issuer": c.organization,
                    "issue_date": c.issue_year,
                } for c in certs
            ],
        }), 200

    except Exception as e:
        print(f"❌ Error fetching public resume: {str(e)}")
        return jsonify({"error": str(e)}), 500


@resume_bp.route("/<int:resume_id>", methods=["GET"])
@jwt_required()
def get_resume(resume_id):
    try:
        user_id = get_jwt_identity()
        resume = Resume.query.filter_by(id=resume_id, user_id=int(user_id)).first()

        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        return jsonify({
            "id": resume.id,
            "title": resume.title,
            "summary": resume.summary,
            "full_name": resume.full_name,
            "professional_title": resume.professional_title,
            "email": resume.email,
            "phone": resume.phone,
            "location": resume.location,
            "linkedin": resume.linkedin,
            "website": resume.website,
            "nationality": resume.nationality,
            "date_of_birth": resume.date_of_birth,
            "template_name": resume.template_name,
            "template_style": resume.template_style,
            "created_at": resume.created_at.isoformat() if resume.created_at else None,
            "updated_at": resume.updated_at.isoformat() if resume.updated_at else None
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@resume_bp.route("/<int:resume_id>", methods=["PUT"])
@jwt_required()
def update_resume(resume_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()

        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        resume.title = data.get("title", resume.title)
        resume.summary = data.get("summary", resume.summary)
        resume.full_name = data.get("full_name", resume.full_name)
        resume.professional_title = data.get("professional_title", resume.professional_title)
        resume.email = data.get("email", resume.email)
        resume.phone = data.get("phone", resume.phone)
        resume.location = data.get("location", resume.location)
        resume.linkedin = data.get("linkedin", resume.linkedin)
        resume.website = data.get("website", resume.website)
        resume.nationality = data.get("nationality", resume.nationality)
        resume.date_of_birth = data.get("date_of_birth", resume.date_of_birth)
        resume.template_name = data.get("template_name", resume.template_name)
        resume.template_style = data.get("template_style", resume.template_style)

        db.session.commit()

        return jsonify({
            "message": "Resume updated successfully",
            "resume": {
                "id": resume.id,
                "title": resume.title,
                "template_name": resume.template_name,
                "template_style": resume.template_style
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@resume_bp.route("/<int:resume_id>", methods=["DELETE"])
@jwt_required()
def delete_resume(resume_id):
    try:
        user_id = get_jwt_identity()
        resume = Resume.query.filter_by(id=resume_id, user_id=int(user_id)).first()

        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        Experience.query.filter_by(resume_id=resume_id).delete()
        Education.query.filter_by(resume_id=resume_id).delete()
        Skill.query.filter_by(resume_id=resume_id).delete()
        Project.query.filter_by(resume_id=resume_id).delete()
        Certification.query.filter_by(resume_id=resume_id).delete()

        db.session.delete(resume)
        db.session.commit()

        return jsonify({"message": "Resume deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@resume_bp.route("/download/<int:resume_id>", methods=["GET"])
@jwt_required()
def download_resume(resume_id):
    try:
        user_id = get_jwt_identity()
        resume = Resume.query.filter_by(id=resume_id, user_id=int(user_id)).first()

        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        pdf = generate_resume_pdf(resume_id)
        filename = f"{resume.title.replace(' ', '_')}.pdf" if resume.title else "resume.pdf"

        return send_file(pdf, as_attachment=True, download_name=filename, mimetype="application/pdf")

    except Exception as e:
        return jsonify({"error": f"Failed to generate PDF: {str(e)}"}), 500