from app.extensions import db
from datetime import datetime


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(
        db.Integer,
        db.ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False
    )
    project_title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    tech_stack = db.Column(db.String(500), nullable=True)  # Added for "Tech Stack"
    link = db.Column(db.String(500), nullable=True)  # Added for "Link"
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow, 
        nullable=False
    )

    # Relationship
    resume = db.relationship(
        "Resume", 
        backref=db.backref("projects", lazy=True, cascade="all, delete-orphan")
    )

    def to_dict(self):
        return { # pragma: no cover
            "id": self.id,
            "resume_id": self.resume_id,
            "project_title": self.project_title,
            "description": self.description,
            "tech_stack": self.tech_stack,
            "link": self.link,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    def __repr__(self):  # pragma: no cover
        return f"<Project {self.project_title}>"