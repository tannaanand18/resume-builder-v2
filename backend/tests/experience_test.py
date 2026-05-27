# tests/experience_test.py
import pytest
import uuid

# =========================================================
# HELPER: Setup Owner and Hacker
# =========================================================
def setup_env(client):
    owner_email = f"owner_{uuid.uuid4()}@test.com"
    hacker_email = f"hacker_{uuid.uuid4()}@test.com"
    
    client.post("/api/auth/register", json={"name": "Owner", "email": owner_email, "password": "pass"})
    client.post("/api/auth/register", json={"name": "Hacker", "email": hacker_email, "password": "pass"})
    
    client.post("/api/auth/login", json={"email": owner_email, "password": "pass"})
    client.post("/api/resume/", json={"title": "Owner Resume"})
    resume_id = client.get("/api/resume/all").get_json()[0]["id"]
    
    return owner_email, hacker_email, resume_id

# =========================================================
# 1. HAPPY PATHS
# =========================================================
def test_experience_happy_paths(client):
    owner, _, resume_id = setup_env(client)
    
    # Create
    res_add = client.post("/api/experience/", json={
        "resume_id": resume_id, "company": "Co", "role": "Dev", "start_date": "2020"
    })
    assert res_add.status_code == 201
    exp_id = res_add.get_json()["id"]
    
    # Read
    assert client.get(f"/api/experience/{resume_id}").status_code == 200
    
    # Update
    assert client.put(f"/api/experience/{exp_id}", json={"company": "New Co"}).status_code == 200
    
    # Delete
    assert client.delete(f"/api/experience/{exp_id}").status_code == 200

# =========================================================
# 2. CHAOS MONKEY: 400 Bad Request & 404 Not Found
# =========================================================
def test_experience_bad_requests(client):
    _, _, resume_id = setup_env(client)
    
    # Missing resume_id
    assert client.post("/api/experience/", json={"company": "Co"}).status_code == 400
    
    # Missing required fields
    assert client.post("/api/experience/", json={"resume_id": resume_id, "company": "Co"}).status_code == 400
    
    # 404 Not Found
    assert client.put("/api/experience/99999", json={}).status_code == 404
    assert client.delete("/api/experience/99999").status_code == 404

# =========================================================
# 3. CHAOS MONKEY: 403 Hacker Access
# =========================================================
def test_experience_hacker_access(client):
    owner, hacker, resume_id = setup_env(client)
    
    # Owner makes experience
    exp_id = client.post("/api/experience/", json={"resume_id": resume_id, "company": "Co", "role": "Dev", "start_date": "2020"}).get_json()["id"]
    
    # SWITCH TO HACKER
    client.post("/api/auth/login", json={"email": hacker, "password": "pass"})
    
    # Hacker tries to post to Owner's resume
    assert client.post("/api/experience/", json={"resume_id": resume_id, "company": "Hack", "role": "Bad", "start_date": "2020"}).status_code == 403
    
    # Hacker tries to read Owner's resume
    assert client.get(f"/api/experience/{resume_id}").status_code == 403
    
    # Hacker tries to update Owner's experience
    assert client.put(f"/api/experience/{exp_id}", json={"company": "Hacked"}).status_code == 403
    
    # Hacker tries to delete Owner's experience
    assert client.delete(f"/api/experience/{exp_id}").status_code == 403