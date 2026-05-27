from app.extensions import db
from datetime import datetime


class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    title = db.Column(db.String(255), nullable=False)
    summary = db.Column(db.Text, nullable=True)

    # 🔥 ADD THESE
    full_name = db.Column(db.String(255))
    professional_title = db.Column(db.String(255))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    location = db.Column(db.String(255))
    linkedin = db.Column(db.String(255))
    website = db.Column(db.String(255))
    nationality = db.Column(db.String(100))
    date_of_birth = db.Column(db.String(50))

    template_name = db.Column(db.String(50), default="simple")
    template_style = db.Column(db.String(50))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return { # pragma: no cover
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'full_name': self.full_name,
            'professional_title': self.professional_title,
            'email': self.email,
            'phone': self.phone,
            'location': self.location,
            'linkedin': self.linkedin,
            'website': self.website,
            'summary': self.summary,
            'template_name': self.template_name,
            'template_style': self.template_style,  # ✅ ADD THIS LINE
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    def __repr__(self):  # pragma: no cover
        return f"<Resume {self.title}>"