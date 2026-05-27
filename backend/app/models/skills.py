from app.extensions import db

class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey("resumes.id"), nullable=False)
    skill_name = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(50), default="Intermediate")  # ✅ add this

    def to_dict(self):
        return {
            "id": self.id,
            "resume_id": self.resume_id,
            "skill_name": self.skill_name,
            "level": self.level,
        }