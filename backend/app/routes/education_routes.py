from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.education import Education
from app.models.resume import Resume

education_bp = Blueprint("education", __name__)

@education_bp.route("/", methods=["POST"])
@jwt_required()
def add_education():
    user_id = get_jwt_identity()
    data = request.get_json()

    resume_id = data.get("resume_id")

    resume = Resume.query.filter_by(
        id=resume_id,
        user_id=int(user_id)
    ).first()

    if not resume:
        return jsonify({"error": "Invalid resume"}), 403

    education = Education(
        resume_id=resume_id,
        degree=data.get("degree"),
        institution=data.get("institution"),
        start_year=data.get("start_year"),
        end_year=data.get("end_year"),
        score=data.get('score')
    )

    db.session.add(education)
    db.session.commit()

    return jsonify({"message": "Education added","id": education.id}), 201


@education_bp.route("/<int:resume_id>", methods=["GET"])
@jwt_required()
def get_education(resume_id):
    

    

    

    education_list = Education.query.filter_by(resume_id=resume_id).all()

    return jsonify([
        {
            "id": edu.id,
            "degree": edu.degree,
            "institution": edu.institution,
            "start_year": edu.start_year,
            "end_year": edu.end_year,
            "score": edu.score
        } for edu in education_list
    ]), 200

@education_bp.route("/<int:edu_id>", methods=["PUT"])
@jwt_required()
def update_education(edu_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    education = db.session.get(Education, edu_id)
    if not education:
        return jsonify({"error": "Education entry not found"}), 404

    resume = Resume.query.filter_by(id=education.resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Unauthorized"}), 403

    education.degree = data.get("degree", education.degree)
    education.institution = data.get("institution", education.institution)
    education.start_year = data.get("start_year", education.start_year)
    education.end_year = data.get("end_year", education.end_year)
    education.score = data.get("score", education.score)

    db.session.commit()
    return jsonify({"message": "Education updated successfully"}), 200


@education_bp.route("/<int:edu_id>", methods=["DELETE"])
@jwt_required()
def delete_education(edu_id):
    # Find the specific education entry in the database by its ID
    education = db.session.get(Education, edu_id)
    
    # If it doesn't exist, tell the frontend we couldn't find it
    if not education:
        return jsonify({"error": "Education entry not found"}), 404

    # Delete it from the database and save the changes
    db.session.delete(education)
    db.session.commit()

    return jsonify({"message": "Education deleted successfully"}), 200