from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.skills import Skill
from app.models.resume import Resume

skill_bp = Blueprint("skill", __name__)

@skill_bp.route("/", methods=["POST"])
@jwt_required()
def add_skill():
    user_id = get_jwt_identity()
    data = request.get_json()

    resume_id = data.get("resume_id")

    if not resume_id or not data.get("name"):
        return jsonify({"error": "resume_id and name are required"}), 400

    resume = Resume.query.filter_by(id=resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Invalid resume"}), 403

    skill = Skill(
        resume_id=resume_id,
        skill_name=data.get("name"),   # ✅ frontend sends "name"
        level=data.get("level", "Intermediate")  # ✅ add level
    )

    db.session.add(skill)
    db.session.commit()

    return jsonify({
        "message": "Skill added successfully",
        "id": skill.id   # ✅ return id
    }), 201


@skill_bp.route("/<int:resume_id>", methods=["GET"])
@jwt_required()
def get_skills(resume_id):
    

    skills = Skill.query.filter_by(resume_id=resume_id).all()

    return jsonify([
        {
            "id": skill.id,
            "name": skill.skill_name,   # ✅ frontend expects "name"
            "level": skill.level if hasattr(skill, 'level') else "Intermediate"
        } for skill in skills
    ]), 200


@skill_bp.route("/<int:skill_id>", methods=["PUT"])
@jwt_required()
def update_skill(skill_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    skill = db.session.get(Skill, skill_id)
    if not skill:
        return jsonify({"error": "Not found"}), 404

    resume = Resume.query.filter_by(id=skill.resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Unauthorized"}), 403

    skill.skill_name = data.get("name", skill.skill_name)
    skill.level = data.get("level", skill.level)

    db.session.commit()
    return jsonify({"message": "Skill updated successfully"}), 200


@skill_bp.route("/<int:skill_id>", methods=["DELETE"])
@jwt_required()
def delete_skill(skill_id):
    user_id = get_jwt_identity()

    skill = db.session.get(Skill, skill_id)
    if not skill:
        return jsonify({"error": "Not found"}), 404

    resume = Resume.query.filter_by(id=skill.resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(skill)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200