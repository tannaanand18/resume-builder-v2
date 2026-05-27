from app.extensions import db
from datetime import datetime


class Education(db.Model):
    __tablename__ = "education"

    id = db.Column(db.Integer, primary_key=True)

    resume_id = db.Column(
        db.Integer,
        db.ForeignKey("resumes.id"),
        nullable=False
    )

    degree = db.Column(db.String(255), nullable=False)
    institution = db.Column(db.String(255), nullable=False)
    start_year = db.Column(db.Integer, nullable=False)
    end_year = db.Column(db.Integer, nullable=True)
    score = db.Column(db.String(50), nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "resume_id": self.resume_id,
            "degree": self.degree,
            "institution": self.institution,
            "start_year": self.start_year,
            "end_year": self.end_year,
            "score": self.score,
        }
