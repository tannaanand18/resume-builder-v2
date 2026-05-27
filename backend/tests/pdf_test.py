# tests/pdf_test.py
import uuid
from app.extensions import db
from app.models.resume import Resume
from app.services.pdf_service import generate_resume_pdf

# =========================================================
# HELPER: Build a massive resume to test every PDF line!
# =========================================================
def setup_full_resume(client):
    email = f"pdf_{uuid.uuid4()}@test.com"
    client.post("/api/auth/register", json={"name": "PDF User", "email": email, "password": "pass"})
    client.post("/api/auth/login", json={"email": email, "password": "pass"})

    # Create Resume
    client.post("/api/resume/", json={
        "title": "PDF Resume", "target_job": "Dev", "template_name": "simple"
    })
    resume_id = client.get("/api/resume/all").get_json()[0]["id"]

    # Fill it with data so the PDF draws every section
    client.post("/api/experience/", json={"resume_id": resume_id, "company": "Co", "role": "Dev", "start_date": "2020", "description": "Did things\nMore things"})
    client.post("/api/education/", json={"resume_id": resume_id, "institution": "Uni", "degree": "BS", "start_year": "2015", "end_year": "2019"})
    client.post("/api/skills/", json={"resume_id": resume_id, "name": "Python", "level": "Expert"})
    client.post("/api/projects/", json={"resume_id": resume_id, "title": "Proj", "description": "A project\nAnother line", "tech_stack": "Python", "link": "http"})
    client.post("/api/certifications/", json={"resume_id": resume_id, "name": "Cert", "issuer": "AWS", "issue_date": "2021"})

    return resume_id

# =========================================================
# 1. TEST ALL 3 PDF TEMPLATES
# =========================================================
def test_pdf_generation_all_templates(client):
    resume_id = setup_full_resume(client)

    # We use the app context to talk to the database and run the PDF service
    with client.application.app_context():
        resume = db.session.get(Resume, resume_id)

        # 1. Test Simple PDF
        resume.template_name = "simple"
        db.session.commit()
        pdf_buffer = generate_resume_pdf(resume_id)
        assert pdf_buffer is not None
        assert len(pdf_buffer.getvalue()) > 1000  # Ensure the PDF actually has data inside!

        # 2. Test Modern PDF
        resume.template_name = "modern"
        db.session.commit()
        pdf_buffer = generate_resume_pdf(resume_id)
        assert pdf_buffer is not None
        assert len(pdf_buffer.getvalue()) > 1000

        # 3. Test Creative PDF
        resume.template_name = "creative"
        db.session.commit()
        pdf_buffer = generate_resume_pdf(resume_id)
        assert pdf_buffer is not None
        assert len(pdf_buffer.getvalue()) > 1000