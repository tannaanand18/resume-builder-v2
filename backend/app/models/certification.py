from app.extensions import db


class Certification(db.Model):
    __tablename__ = "certifications"

    id = db.Column(db.Integer, primary_key=True)

    resume_id = db.Column(
        db.Integer,
        db.ForeignKey("resumes.id"),
        nullable=False
    )

    title = db.Column(db.String(255), nullable=False)
    organization = db.Column(db.String(255), nullable=True)
    issue_year = db.Column(db.String(50), nullable=True)  # ✅ String not Integer

    def to_dict(self):
        return {
            "id": self.id,
            "resume_id": self.resume_id,
            "title": self.title,
            "organization": self.organization,
            "issue_year": self.issue_year,
        }
