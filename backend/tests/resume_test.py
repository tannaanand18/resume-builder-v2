# tests/resume_test.py
import pytest
from unittest.mock import patch
import uuid
from io import BytesIO

# =========================================================
# HELPER: Quick User Setup
# =========================================================
def setup_user(client):
    email = f"resume_{uuid.uuid4()}@test.com"
    client.post("/api/auth/register", json={"name": "Res User", "email": email, "password": "pass"})
    client.post("/api/auth/login", json={"email": email, "password": "pass"})

# =========================================================
# 1. THE HAPPY PATHS & THE TEMPLATE MAPPER
# =========================================================
def test_resume_crud_and_download(client):
    setup_user(client)

    # CREATE (Testing the TEMPLATE_MAP logic by sending "obsidian")
    res_create = client.post("/api/resume/", json={
        "title": "My Test Resume",
        "template_name": "obsidian", 
        "template_style": "classic"
    })
    assert res_create.status_code == 201
    resume_id = res_create.get_json()["resume_id"]
    
    # Verify the backend correctly translated "obsidian" to "creative"
    assert res_create.get_json()["template_name"] == "creative" 

    # READ ALL
    res_all = client.get("/api/resume/all")
    assert res_all.status_code == 200
    assert len(res_all.get_json()) > 0

    # READ ONE
    res_one = client.get(f"/api/resume/{resume_id}")
    assert res_one.status_code == 200
    assert res_one.get_json()["title"] == "My Test Resume"

    # UPDATE
    res_update = client.put(f"/api/resume/{resume_id}", json={
        "title": "Updated Title",
        "full_name": "Smit Patel"
    })
    assert res_update.status_code == 200

    # DOWNLOAD (Mocking the PDF generator so it doesn't slow down the test)
    with patch("app.routes.resume_routes.generate_resume_pdf") as mock_pdf:
        mock_pdf.return_value = BytesIO(b"Fake PDF data")
        res_download = client.get(f"/api/resume/download/{resume_id}")
        assert res_download.status_code == 200

    # DELETE
    res_delete = client.delete(f"/api/resume/{resume_id}")
    assert res_delete.status_code == 200

# =========================================================
# 2. THE CHAOS MONKEY: 404 NOT FOUND ERRORS
# =========================================================
def test_resume_not_found_errors(client):
    setup_user(client)
    fake_id = 999999  # A resume that doesn't exist

    assert client.get(f"/api/resume/{fake_id}").status_code == 404
    assert client.put(f"/api/resume/{fake_id}", json={"title": "Hacked"}).status_code == 404
    assert client.delete(f"/api/resume/{fake_id}").status_code == 404
    assert client.get(f"/api/resume/download/{fake_id}").status_code == 404

# =========================================================
# 3. THE CHAOS MONKEY: 500 SERVER ERRORS (Simulate DB Crash)
# =========================================================

def test_resume_create_500(client):
    setup_user(client) # Let the user register safely FIRST!
    
    # NOW arm the bomb right before the route is called
    with patch("app.routes.resume_routes.db.session.commit", side_effect=Exception("DB Exploded!")):
        res = client.post("/api/resume/", json={"title": "Crash Test"})
        assert res.status_code == 500

def test_resume_get_all_500(client):
    setup_user(client)
    # Patch get_jwt_identity to force a crash inside the try/except block
    with patch("app.routes.resume_routes.get_jwt_identity", side_effect=Exception("Auth Exploded!")):
        assert client.get("/api/resume/all").status_code == 500

def test_resume_get_one_500(client):
    setup_user(client)
    with patch("app.routes.resume_routes.get_jwt_identity", side_effect=Exception("Auth Exploded!")):
        assert client.get("/api/resume/1").status_code == 500

def test_resume_update_500(client):
    setup_user(client)
    with patch("app.routes.resume_routes.get_jwt_identity", side_effect=Exception("Auth Exploded!")):
        assert client.put("/api/resume/1", json={"title": "A"}).status_code == 500

def test_resume_delete_500(client):
    setup_user(client)
    with patch("app.routes.resume_routes.get_jwt_identity", side_effect=Exception("Auth Exploded!")):
        assert client.delete("/api/resume/1").status_code == 500

def test_resume_download_500(client):
    setup_user(client)
    with patch("app.routes.resume_routes.get_jwt_identity", side_effect=Exception("Auth Exploded!")):
        assert client.get("/api/resume/download/1").status_code == 500