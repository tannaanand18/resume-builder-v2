from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, decode_token
import os
from flask_mail import Message
from app.extensions import db, mail
from app.models.resume import Resume
from app.models.user import User
from app.models.experience import Experience
from app.models.education import Education
from app.models.skills import Skill
from app.models.project import Project
from app.models.certification import Certification
from datetime import timedelta
from urllib.parse import quote  # ✅ proper URL encoding

share_bp = Blueprint("share", __name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
SHARE_TOKEN_EXPIRY = timedelta(days=30)


# ──────────────────────────────────────────────
# HELPER: Generate a share token + URL
# ──────────────────────────────────────────────
def _generate_share_url(user_id: str, resume_id: str) -> tuple[str, str]:
    """Returns (share_token, share_url)."""
    share_token = create_access_token(
        identity=str(user_id),
        additional_claims={"resume_id": str(resume_id), "share": True},
        expires_delta=SHARE_TOKEN_EXPIRY,
    )
    share_url = f"{FRONTEND_URL}/resume/{resume_id}/preview?token={share_token}"
    return share_token, share_url


# ──────────────────────────────────────────────
# HELPER: Verify resume ownership
# ──────────────────────────────────────────────
def _get_resume_or_404(resume_id: str, user_id: str):
    """Returns resume or None."""
    return Resume.query.filter_by(id=resume_id, user_id=user_id).first()


# ============================================
# 1. GENERATE SHAREABLE LINK
# ============================================
@share_bp.route("/generate-link/<resume_id>", methods=["POST"])
@jwt_required()
def generate_share_link(resume_id):
    """
    Generate a shareable link for a resume using JWT (no DB storage).
    Returns: { success, share_link, token }
    """
    try:
        user_id = get_jwt_identity()
        resume = _get_resume_or_404(resume_id, user_id)
        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        share_token, share_url = _generate_share_url(user_id, resume_id)

        return jsonify({
            "success": True,
            "share_link": share_url,
            "token": share_token,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ============================================
# 2. SHARE VIA EMAIL
# ============================================
@share_bp.route("/email", methods=["POST"])
@jwt_required()
def share_via_email():
    """
    Share resume via email.
    Expected JSON:
    {
        "resume_id": "...",
        "recipient_email": "example@example.com",
        "recipient_name": "John",       (optional)
        "message": "Check this out!"    (optional)
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json(silent=True)

        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        resume_id = str(data.get("resume_id", "")).strip() # this i change  already
        recipient_email = data.get("recipient_email", "").strip()
        recipient_name = data.get("recipient_name", "Friend").strip() or "Friend"
        custom_message = data.get("message", "").strip()

        # Validate required fields
        if not resume_id:
            return jsonify({"error": "resume_id is required"}), 400
        if not recipient_email:
            return jsonify({"error": "recipient_email is required"}), 400

        # Basic email format check
        if "@" not in recipient_email or "." not in recipient_email.split("@")[-1]:
            return jsonify({"error": "Invalid email address"}), 400

        # Verify resume ownership
        resume = _get_resume_or_404(resume_id, user_id)
        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        # Get sender info
        user = db.session.get(User, user_id)  # SQLAlchemy 2.x compatible
        if not user:
            return jsonify({"error": "User not found"}), 404

        # user.name is the correct field per User model
        sender_name = user.name or user.email.split("@")[0]
        resume_title = resume.title or "Resume"

        # Generate share link
        _, share_url = _generate_share_url(user_id, resume_id)

        # ✅ Return share link — email is sent by frontend via EmailJS
        return jsonify({
            "success": True,
            "message": f"Share link generated for {recipient_email}",
            "share_link": share_url,
            "recipient_email": recipient_email,
            "recipient_name": recipient_name,
            "sender_name": sender_name,
            "resume_title": resume_title,
        }), 200

    except Exception as e:
        error_str = str(e)
        print(f"❌ Share email error: {error_str}")
        return jsonify({"error": f"Server error: {error_str}"}), 500


# ============================================
# 3. WHATSAPP SHARE LINK
# ============================================
@share_bp.route("/whatsapp-link/<resume_id>", methods=["GET"])
@jwt_required()
def get_whatsapp_link(resume_id):
    """
    Generate a pre-filled WhatsApp share link.
    Returns: { success, share_link, whatsapp_link, message }
    """
    try:
        user_id = get_jwt_identity()
        resume = _get_resume_or_404(resume_id, user_id)
        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        _, share_url = _generate_share_url(user_id, resume_id)

        # Get user name for a personalized message
        user = db.session.get(User, user_id)
        sender_name = user.name if user else "Someone"
        resume_title = resume.title or "Resume"

        # ✅ Professional short WhatsApp message — URL on its own line for preview
        wa_text = (
            f"Hi! {sender_name} has shared their professional resume with you.\n\n"
            f"📄 *{resume_title}*\n"
            f"{share_url}\n\n"
            f"_Shared via ResumeAI_"
        )
        whatsapp_link = f"https://wa.me/?text={quote(wa_text)}"

        return jsonify({
            "success": True,
            "share_link": share_url,
            "whatsapp_link": whatsapp_link,
            "message": wa_text,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ============================================
# 4. LINKEDIN SHARE LINK
# ============================================
@share_bp.route("/linkedin-link/<resume_id>", methods=["GET"])
@jwt_required()
def get_linkedin_link(resume_id):
    """
    Generate a LinkedIn share link.
    Returns: { success, share_link, linkedin_link }
    """
    try:
        user_id = get_jwt_identity()
        resume = _get_resume_or_404(resume_id, user_id)
        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        _, share_url = _generate_share_url(user_id, resume_id)

        # ✅ Properly encode the URL for LinkedIn sharing
        linkedin_link = f"https://www.linkedin.com/sharing/share-offsite/?url={quote(share_url, safe='')}"

        return jsonify({
            "success": True,
            "share_link": share_url,
            "linkedin_link": linkedin_link,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ============================================
# 5. VIEW SHARED RESUME (PUBLIC, NO AUTH)
# ============================================
@share_bp.route("/<resume_id>/public", methods=["GET"])
def view_shared_resume(resume_id):
    """
    View a shared resume using JWT token from URL query param.
    Query params:
      - token: The JWT share token
    Returns: { success, resume, is_shared }
    """
    try:
        token = request.args.get("token", "").strip()

        if not token:
            return jsonify({"error": "Share token is required"}), 401

        # ── Validate token ──
        try:
            decoded = decode_token(token)
        except Exception as token_err:
            return jsonify({"error": f"Invalid or expired token: {str(token_err)}"}), 401

        token_resume_id = str(decoded.get("resume_id", ""))
        is_share = decoded.get("share", False)

        if not is_share:
            return jsonify({"error": "This token is not a share token"}), 401

        if token_resume_id != str(resume_id):
            return jsonify({"error": "Token does not match this resume"}), 401

        # ── Fetch resume + all nested data ──
        resume = Resume.query.filter_by(id=resume_id).first()
        if not resume:
            return jsonify({"error": "Resume not found"}), 404

        resume_dict = resume.to_dict()

        # ── Fetch nested data (same format as ResumeView) ──
        experiences  = Experience.query.filter_by(resume_id=resume_id).all()
        educations   = Education.query.filter_by(resume_id=resume_id).all()
        skills       = Skill.query.filter_by(resume_id=resume_id).all()
        projects     = Project.query.filter_by(resume_id=resume_id).all()
        certs        = Certification.query.filter_by(resume_id=resume_id).all()

        return jsonify({
            "success":      True,
            "is_shared":    True,
            "resume":       resume_dict,
            "experiences":  [e.to_dict() for e in experiences],
            "educations":   [e.to_dict() for e in educations],
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
        return jsonify({"error": f"Server error: {str(e)}"}), 500