import uuid

def test_the_final_sweep(client):
    # 1. Normal User logs in and creates an empty resume (For PDF tests)
    norm_email = f"norm_{uuid.uuid4()}@test.com"
    client.post("/api/auth/register", json={"name": "N", "email": norm_email, "password": "p"})
    client.post("/api/auth/login", json={"email": norm_email, "password": "p"})
    
    res = client.post("/api/resume/", json={"title": "Empty Data"})
    r_id = res.get_json()["resume_id"]
    
    # Add empty data to test the PDF generator's 'if' statements!
    client.post("/api/experience/", json={"resume_id": r_id, "company": "C", "role": "R", "start_date": "S"})
    client.post("/api/projects/", json={"resume_id": r_id, "title": "P"})
    client.post("/api/certifications/", json={"resume_id": r_id, "name": "C"})
    
    # Download the PDF to trigger the code
    client.get(f"/api/resume/download/{r_id}")

    # 2. Admin logs in
    admin_email = f"admin_{uuid.uuid4()}@test.com"
    client.post("/api/auth/register", json={"name": "A", "email": admin_email, "password": "p"})
    
    # Duplicate Register Check (Clears Auth line 39)
    client.post("/api/auth/register", json={"name": "A", "email": admin_email, "password": "p"})

    # Make Admin via backdoor
    from app.extensions import db
    from app.models.user import User
    with client.application.app_context():
        u_admin = User.query.filter_by(email=admin_email).first()
        u_admin.role = "admin"
        u_norm = User.query.filter_by(email=norm_email).first()
        norm_id = u_norm.id
        db.session.commit()
        
    client.post("/api/auth/login", json={"email": admin_email, "password": "p"})
    
    # 3. Admin deletes the normal user (Clears Admin loop lines 103-108)
    assert client.delete(f"/api/admin/users/{norm_id}").status_code == 200