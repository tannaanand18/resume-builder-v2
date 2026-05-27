from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.certification import Certification
from app.models.resume import Resume

certification_bp = Blueprint("certification", __name__)

@certification_bp.route("/", methods=["POST"])
@jwt_required()
def add_certification():
    user_id = get_jwt_identity()
    data = request.get_json()

    resume_id = data.get("resume_id")

    # ✅ frontend sends "name", fallback to "title"
    name = data.get("name") or data.get("title")

    if not resume_id or not name:
        return jsonify({"error": "resume_id and name are required"}), 400

    resume = Resume.query.filter_by(id=resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Invalid resume"}), 403

    certification = Certification(
        resume_id=resume_id,
        title=name,                              # ✅ store "name" as title
        organization=data.get("issuer"),         # ✅ frontend sends "issuer"
        issue_year=data.get("issue_date"),       # ✅ frontend sends "issue_date"
    )

    db.session.add(certification)
    db.session.commit()

    return jsonify({
        "message": "Certification added successfully",
        "id": certification.id    # ✅ return id for instant preview
    }), 201


@certification_bp.route("/<int:resume_id>", methods=["GET"])
@jwt_required()
def get_certifications(resume_id):
   

    certifications = Certification.query.filter_by(resume_id=resume_id).all()

    return jsonify([
        {
            "id": c.id,
            "name": c.title,                # ✅ frontend expects "name"
            "issuer": c.organization,       # ✅ frontend expects "issuer"
            "issue_date": str(c.issue_year) if c.issue_year else ""  # ✅ frontend expects "issue_date"
        } for c in certifications
    ]), 200


@certification_bp.route("/<int:cert_id>", methods=["PUT"])
@jwt_required()
def update_certification(cert_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    cert = db.session.get(Certification, cert_id)
    if not cert:
        return jsonify({"error": "Certification not found"}), 404

    resume = Resume.query.filter_by(id=cert.resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Unauthorized"}), 403

    # ✅ accept both field name styles
    cert.title = data.get("name") or data.get("title", cert.title)
    cert.organization = data.get("issuer") or data.get("organization", cert.organization)
    cert.issue_year = data.get("issue_date") or data.get("issue_year", cert.issue_year)

    db.session.commit()
    return jsonify({"message": "Certification updated successfully"}), 200


@certification_bp.route("/<int:cert_id>", methods=["DELETE"])
@jwt_required()
def delete_certification(cert_id):
    user_id = get_jwt_identity()

    cert = db.session.get(Certification, cert_id)
    if not cert:
        return jsonify({"error": "Certification not found"}), 404

    resume = Resume.query.filter_by(id=cert.resume_id, user_id=int(user_id)).first()
    if not resume:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(cert)
    db.session.commit()
    return jsonify({"message": "Certification deleted successfully"}), 200