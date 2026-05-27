from app.extensions import db
from datetime import datetime

class Experience(db.Model):
    __tablename__ = "experience"

    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey("resumes.id"), nullable=False)
    company = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.String(50), nullable=False)  # ✅ changed to String
    end_date = db.Column(db.String(50), nullable=True)     # ✅ changed to String
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "resume_id": self.resume_id,
            "company": self.company,
            "role": self.role,
            "description": self.description,
            "start_date": self.start_date,
            "end_date": self.end_date,
        }    