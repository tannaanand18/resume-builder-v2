from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.experience import Experience
from app.models.resume import Resume

experience_bp = Blueprint("experience", __name__)

@experience_bp.route("/", methods=["POST"])
@jwt_required()
def add_experience():
    user_id = get_jwt_identity()
    data = request.get_json()

    resume_id = data.get("resume_id")
    if not resume_id:
        return jsonify({"error": "resume_id is required"}), 400

    resume = Resume.query.filter_by(id=resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Invalid resume"}), 403

    if not data.get("company") or not data.get("role") or not data.get("start_date"):
        return jsonify({"error": "company, role and start_date are required"}), 400

    # ✅ NO date parsing — store as plain text
    experience = Experience(
        resume_id=resume_id,
        company=data.get("company"),
        role=data.get("role"),
        description=data.get("description"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
    )

    db.session.add(experience)
    db.session.commit()

    return jsonify({
        "message": "Experience added successfully",
        "id": experience.id   # ✅ return id
    }), 201


@experience_bp.route("/<int:resume_id>", methods=["GET"])
@jwt_required()
def get_experience(resume_id):
    user_id = get_jwt_identity()

    resume = Resume.query.filter_by(id=resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Invalid resume"}), 403

    experience_list = Experience.query.filter_by(resume_id=resume_id).all()

    return jsonify([
        {
            "id": exp.id,
            "company": exp.company,
            "role": exp.role,
            "description": exp.description,
            "start_date": str(exp.start_date) if exp.start_date else "",
            "end_date": str(exp.end_date) if exp.end_date else ""
        } for exp in experience_list
    ]), 200


@experience_bp.route("/<int:experience_id>", methods=["PUT"])
@jwt_required()
def update_experience(experience_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    experience = db.session.get(Experience, experience_id)
    if not experience:
        return jsonify({"error": "Not found"}), 404

    resume = Resume.query.filter_by(id=experience.resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Unauthorized"}), 403

    experience.company = data.get("company", experience.company)
    experience.role = data.get("role", experience.role)
    experience.description = data.get("description", experience.description)
    experience.start_date = data.get("start_date", experience.start_date)
    experience.end_date = data.get("end_date", experience.end_date)

    db.session.commit()
    return jsonify({"message": "Experience updated successfully"}), 200


@experience_bp.route("/<int:experience_id>", methods=["DELETE"])
@jwt_required()
def delete_experience(experience_id):
    user_id = get_jwt_identity()

    experience = db.session.get(Experience, experience_id)
    if not experience:
        return jsonify({"error": "Not found"}), 404

    resume = Resume.query.filter_by(id=experience.resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(experience)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200