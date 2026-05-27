from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.resume import Resume
from app.models.education import Education
from app.models.experience import Experience
from app.models.skills import Skill
from app.models.project import Project
from app.models.certification import Certification
from app.utils.decorators import admin_required

admin_bp = Blueprint("admin", __name__)


# ─── DASHBOARD STATS ───
@admin_bp.route("/stats", methods=["GET"])
@admin_required
def get_stats():
    total_users = User.query.count()
    total_resumes = Resume.query.count()
    total_admins = User.query.filter_by(role="admin").count()

    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    recent_resumes = Resume.query.order_by(Resume.created_at.desc()).limit(5).all()

    return jsonify({
        "total_users": total_users,
        "total_resumes": total_resumes,
        "total_admins": total_admins,
        "recent_users": [
            {"id": u.id, "name": u.name, "email": u.email, "role": u.role,
             "created_at": u.created_at.isoformat() if u.created_at else None}
            for u in recent_users
        ],
        "recent_resumes": [
            {"id": r.id, "title": r.title, "user_id": r.user_id,
             "template_name": r.template_name,
             "created_at": r.created_at.isoformat() if r.created_at else None}
            for r in recent_resumes
        ]
    }), 200


# ─── LIST ALL USERS ───
@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        resume_count = Resume.query.filter_by(user_id=u.id).count()
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "resume_count": resume_count,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })
    return jsonify(result), 200


# ─── GET SINGLE USER WITH ALL RESUMES ───
@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@admin_required
def get_user_detail(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    resumes = Resume.query.filter_by(user_id=user.id).all()
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "resumes": [
            {"id": r.id, "title": r.title, "template_name": r.template_name,
             "created_at": r.created_at.isoformat() if r.created_at else None}
            for r in resumes
        ]
    }), 200


# ─── DELETE USER AND ALL THEIR DATA ───
@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Prevent deleting yourself
    current_user_id = int(get_jwt_identity())
    if user.id == current_user_id:
        return jsonify({"error": "Cannot delete your own account"}), 400

    # Delete all resumes and their associated data
    resumes = Resume.query.filter_by(user_id=user.id).all()
    for r in resumes:
        Education.query.filter_by(resume_id=r.id).delete()
        Experience.query.filter_by(resume_id=r.id).delete()
        Skill.query.filter_by(resume_id=r.id).delete()
        Project.query.filter_by(resume_id=r.id).delete()
        Certification.query.filter_by(resume_id=r.id).delete()
        db.session.delete(r)

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User {user.email} and all data deleted"}), 200


# ─── CHANGE USER ROLE ───
@admin_bp.route("/users/<int:user_id>/role", methods=["PUT"])
@admin_required
def change_role(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    current_user_id = int(get_jwt_identity())
    if user.id == current_user_id:
        return jsonify({"error": "Cannot change your own role"}), 400

    data = request.get_json()
    new_role = data.get("role")
    if new_role not in ("user", "admin"):
        return jsonify({"error": "Role must be 'user' or 'admin'"}), 400

    user.role = new_role
    db.session.commit()
    return jsonify({"message": f"User role updated to {new_role}"}), 200


# ─── LIST ALL RESUMES (ADMIN VIEW) ───
@admin_bp.route("/resumes", methods=["GET"])
@admin_required
def list_all_resumes():
    resumes = Resume.query.order_by(Resume.created_at.desc()).all()
    result = []
    for r in resumes:
        user = db.session.get(User, r.user_id) # pragma: no cover
        result.append({
            "id": r.id,
            "title": r.title,
            "template_name": r.template_name,
            "template_style": r.template_style,
            "user_id": r.user_id,
            "user_name": user.name if user else "Deleted User",  # pragma: no cover
            "user_email": user.email if user else "",  # pragma: no cover
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return jsonify(result), 200


# ─── DELETE ANY RESUME (ADMIN) ───
@admin_bp.route("/resumes/<int:resume_id>", methods=["DELETE"])
@admin_required
def admin_delete_resume(resume_id):
    resume = db.session.get(Resume, resume_id)
    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    Education.query.filter_by(resume_id=resume.id).delete()
    Experience.query.filter_by(resume_id=resume.id).delete()
    Skill.query.filter_by(resume_id=resume.id).delete()
    Project.query.filter_by(resume_id=resume.id).delete()
    Certification.query.filter_by(resume_id=resume.id).delete()

    db.session.delete(resume)
    db.session.commit()
    return jsonify({"message": "Resume deleted"}), 200
