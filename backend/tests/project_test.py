# tests/project_test.py
import pytest
from unittest.mock import patch
import uuid

# =========================================================
# HELPER: Setup Owner, Hacker, and a Resume
# =========================================================
def setup_env(client):
    owner_email = f"owner_{uuid.uuid4()}@test.com"
    hacker_email = f"hacker_{uuid.uuid4()}@test.com"
    
    # Register both users
    client.post("/api/auth/register", json={"name": "Owner", "email": owner_email, "password": "pass"})
    client.post("/api/auth/register", json={"name": "Hacker", "email": hacker_email, "password": "pass"})
    
    # Login Owner and create a resume
    client.post("/api/auth/login", json={"email": owner_email, "password": "pass"})
    client.post("/api/resume/", json={"title": "Owner Resume"})
    resume_id = client.get("/api/resume/all").get_json()[0]["id"]
    
    return owner_email, hacker_email, resume_id

# =========================================================
# 1. THE HAPPY PATHS (CRUD)
# =========================================================
def test_project_happy_paths(client):
    owner_email, _, resume_id = setup_env(client)
    
    # CREATE
    res_add = client.post("/api/projects/", json={
        "resume_id": resume_id, "title": "Great App"
    })
    assert res_add.status_code == 201
    proj_id = res_add.get_json()["id"]
    
    # READ
    res_get = client.get(f"/api/projects/{resume_id}")
    assert res_get.status_code == 200
    assert len(res_get.get_json()) == 1
    
    # UPDATE
    res_up = client.put(f"/api/projects/{proj_id}", json={
        "title": "Even Better App", "description": "New", "tech_stack": "React", "link": "http"
    })
    assert res_up.status_code == 200
    
    # DELETE
    res_del = client.delete(f"/api/projects/{proj_id}")
    assert res_del.status_code == 200

# =========================================================
# 2. CHAOS MONKEY: 400 BAD REQUESTS (Validation Traps)
# =========================================================
def test_project_bad_requests(client):
    _, _, resume_id = setup_env(client)
    
    # 1. POST: No data at all
    assert client.post("/api/projects/", json={}).status_code == 400
    
    # 2. POST: Missing resume_id
    assert client.post("/api/projects/", json={"title": "App"}).status_code == 400
    
    # 3. POST: Missing title
    assert client.post("/api/projects/", json={"resume_id": resume_id}).status_code == 400
    
    # 4. POST: Title too long (> 255 chars)
    long_title = "A" * 256
    assert client.post("/api/projects/", json={"resume_id": resume_id, "title": long_title}).status_code == 400
    
    # Create a real project to test PUT
    proj_id = client.post("/api/projects/", json={"resume_id": resume_id, "title": "App"}).get_json()["id"]
    
    # 5. PUT: No data
    assert client.put(f"/api/projects/{proj_id}", json={}).status_code == 400
    
    # 6. PUT: Empty title string
    assert client.put(f"/api/projects/{proj_id}", json={"title": "   "}).status_code == 400

# =========================================================
# 3. CHAOS MONKEY: 403 UNAUTHORIZED (The Hacker)
# =========================================================
def test_project_hacker_access(client):
    owner_email, hacker_email, resume_id = setup_env(client)
    
    # Create project as OWNER
    proj_id = client.post("/api/projects/", json={"resume_id": resume_id, "title": "App"}).get_json()["id"]
    
    # SWITCH TO HACKER
    client.post("/api/auth/login", json={"email": hacker_email, "password": "pass"})
    
    # Hacker tries to add project to Owner's resume
    assert client.post("/api/projects/", json={"resume_id": resume_id, "title": "Hack App"}).status_code == 403
    
    # Hacker tries to read Owner's projects
    assert client.get(f"/api/projects/{resume_id}").status_code == 403
    
    # Hacker tries to update Owner's project
    assert client.put(f"/api/projects/{proj_id}", json={"title": "Hacked App"}).status_code == 403
    
    # Hacker tries to delete Owner's project
    assert client.delete(f"/api/projects/{proj_id}").status_code == 403

# =========================================================
# 4. CHAOS MONKEY: 404 NOT FOUND
# =========================================================
def test_project_not_found(client):
    setup_env(client)
    fake_id = 99999
    
    assert client.put(f"/api/projects/{fake_id}", json={"title": "No"}).status_code == 404
    assert client.delete(f"/api/projects/{fake_id}").status_code == 404

# =========================================================
# 5. CHAOS MONKEY: 500 SERVER ERRORS (DB Crashes)
# =========================================================
def test_project_500_errors(client):
    _, _, resume_id = setup_env(client)
    proj_id = client.post("/api/projects/", json={"resume_id": resume_id, "title": "App"}).get_json()["id"]

    # 1. Crash the POST route
    with patch("app.routes.project_routes.db.session.commit", side_effect=Exception("DB Boom!")):
        assert client.post("/api/projects/", json={"resume_id": resume_id, "title": "App2"}).status_code == 500
        
    # 2. Crash the PUT route
    with patch("app.routes.project_routes.db.session.commit", side_effect=Exception("DB Boom!")):
        assert client.put(f"/api/projects/{proj_id}", json={"title": "App3"}).status_code == 500

    # 3. Crash the DELETE route
    with patch("app.routes.project_routes.db.session.commit", side_effect=Exception("DB Boom!")):
        assert client.delete(f"/api/projects/{proj_id}").status_code == 500