# tests/admin_test.py
import uuid
from app.extensions import db
from app.models.user import User

# =========================================================
# HELPER: The VIP Backdoor Setup
# =========================================================
def setup_admin_and_user(client):
    admin_email = f"admin_{uuid.uuid4()}@test.com"
    normal_email = f"normal_{uuid.uuid4()}@test.com"
    
    client.post("/api/auth/register", json={"name": "Admin", "email": admin_email, "password": "pass"})
    client.post("/api/auth/register", json={"name": "Normal", "email": normal_email, "password": "pass"})
    
    with client.application.app_context():
        admin_user = User.query.filter_by(email=admin_email).first()
        admin_user.role = "admin"
        db.session.commit()
        
        admin_id = admin_user.id
        normal_id = User.query.filter_by(email=normal_email).first().id
        
    client.post("/api/auth/login", json={"email": admin_email, "password": "pass"})
    
    return admin_id, normal_id

# =========================================================
# TEST DASHBOARD & LISTS
# =========================================================
def test_admin_stats_and_users(client):
    admin_id, normal_id = setup_admin_and_user(client)
    
    assert client.get("/api/admin/stats").status_code == 200
    assert client.get("/api/admin/users").status_code == 200
    assert client.get(f"/api/admin/users/{normal_id}").status_code == 200
    assert client.get(f"/api/admin/users/99999").status_code == 404 # Fake User
    assert client.get("/api/admin/resumes").status_code == 200

# =========================================================
# TEST ADMIN ACTIONS & CHAOS MONKEY (Self-Harm Prevention)
# =========================================================
def test_admin_actions(client):
    admin_id, normal_id = setup_admin_and_user(client)
    
    # --- Role Changes ---
    # Happy Path
    assert client.put(f"/api/admin/users/{normal_id}/role", json={"role": "admin"}).status_code == 200
    # Bad Role Name
    assert client.put(f"/api/admin/users/{normal_id}/role", json={"role": "superman"}).status_code == 400
    # Try changing own role (Trigger line 121)
    assert client.put(f"/api/admin/users/{admin_id}/role", json={"role": "user"}).status_code == 400
    # Try changing fake user (Trigger line 116)
    assert client.put(f"/api/admin/users/99999/role", json={"role": "user"}).status_code == 404

    # --- Deletions ---
    # Try deleting self (Trigger line 93)
    assert client.delete(f"/api/admin/users/{admin_id}").status_code == 400
    # Try deleting fake user (Trigger line 88)
    assert client.delete(f"/api/admin/users/99999").status_code == 404
    # Try deleting fake resume (Trigger line 164)
    assert client.delete(f"/api/admin/resumes/99999").status_code == 404
    
    # Happy Path Deletes
    client.post("/api/auth/login", json={"email": "normal_{uuid.uuid4()}@test.com", "password": "pass"})
    client.post("/api/resume/", json={"title": "Target Resume"})
    resumes = client.get("/api/resume/all").get_json()
    
    client.post("/api/auth/login", json={"email": f"admin_{uuid.uuid4()}@test.com", "password": "pass"}) # Back to admin
    
    if len(resumes) > 0:
        resume_id = resumes[0]["id"]
        assert client.delete(f"/api/admin/resumes/{resume_id}").status_code == 200
    
    assert client.delete(f"/api/admin/users/{normal_id}").status_code == 200