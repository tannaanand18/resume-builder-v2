from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.project import Project
from app.models.resume import Resume

project_bp = Blueprint("project", __name__)


def verify_resume_ownership(resume_id, user_id):
    resume = Resume.query.filter_by(id=resume_id, user_id=int(user_id)).first()
    return resume


@project_bp.route("/", methods=["POST"])
@jwt_required()
def add_project():
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    resume_id = data.get("resume_id")

    # ✅ accept both "title" (frontend) and "project_title" (legacy)
    project_title = (data.get("title") or data.get("project_title", "")).strip()

    if not resume_id:
        return jsonify({"error": "resume_id is required"}), 400

    if not project_title:
        return jsonify({"error": "title is required"}), 400

    if len(project_title) > 255:
        return jsonify({"error": "title too long (max 255 characters)"}), 400

    resume = verify_resume_ownership(resume_id, user_id)
    if not resume:
        return jsonify({"error": "Resume not found or unauthorized"}), 403

    try:
        project = Project(
            resume_id=resume_id,
            project_title=project_title,
            description=data.get("description", "").strip() if data.get("description") else None,
            tech_stack=data.get("tech_stack", "").strip() if data.get("tech_stack") else None,
            link=data.get("link", "").strip() if data.get("link") else None
        )

        db.session.add(project)
        db.session.commit()

        return jsonify({
            "message": "Project added successfully",
            "id": project.id    # ✅ frontend needs "id"
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to add project: {str(e)}"}), 500


@project_bp.route("/<int:resume_id>", methods=["GET"])
@jwt_required()
def get_projects(resume_id):
    user_id = get_jwt_identity()

    resume = verify_resume_ownership(resume_id, user_id)
    if not resume:
        return jsonify({"error": "Resume not found or unauthorized"}), 403

    projects = Project.query.filter_by(resume_id=resume_id).all()

    return jsonify([
        {
            "id": p.id,
            "title": p.project_title,       # ✅ frontend expects "title"
            "description": p.description,
            "tech_stack": p.tech_stack,
            "link": p.link
        } for p in projects
    ]), 200


@project_bp.route("/<int:project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    resume = verify_resume_ownership(project.resume_id, user_id)
    if not resume:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        # ✅ accept both "title" and "project_title"
        if "title" in data or "project_title" in data:
            project_title = (data.get("title") or data.get("project_title", "")).strip()
            if not project_title:
                return jsonify({"error": "title cannot be empty"}), 400
            project.project_title = project_title

        if "description" in data:
            project.description = data.get("description", "").strip() or None

        if "tech_stack" in data:
            project.tech_stack = data.get("tech_stack", "").strip() or None

        if "link" in data:
            project.link = data.get("link", "").strip() or None

        db.session.commit()

        return jsonify({
            "message": "Project updated successfully",
            "id": project.id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update project: {str(e)}"}), 500


@project_bp.route("/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    user_id = get_jwt_identity()

    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    resume = verify_resume_ownership(project.resume_id, user_id)
    if not resume:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        db.session.delete(project)
        db.session.commit()
        return jsonify({"message": "Project deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete project: {str(e)}"}), 500