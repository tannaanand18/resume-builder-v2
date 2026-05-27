# tests/ai_test.py
from unittest.mock import patch

def setup_dummy_with_resume(client):
    client.post("/api/auth/register", json={"name": "AI User", "email": "ai@example.com", "password": "pass"})
    client.post("/api/auth/login", json={"email": "ai@example.com", "password": "pass"})
    client.post("/api/resume/", json={"title": "My Resume", "target_job": "Dev"})
    return client.get("/api/resume/all").get_json()[0]["id"]

# =========================================================
# 1. TEST AI SUMMARY GENERATION
# =========================================================
# We intercept the function right where it is imported in ai_routes!
@patch("app.routes.ai_routes.generate_summary")
def test_ai_generate_summary(mock_generate_summary, client):
    # 1. Tell the mock to hand back a fake AI response
    mock_generate_summary.return_value = "This is a fake AI generated summary."
    
    resume_id = setup_dummy_with_resume(client)
    
    # 2. ACT: Call the route
    response = client.get(f"/api/ai/generate-summary/{resume_id}")
    
    # 3. ASSERT: Check if it worked and if it returned our fake text!
    assert response.status_code == 200
    assert response.get_json()["ai_generated_summary"] == "This is a fake AI generated summary."

# =========================================================
# 2. TEST AI EXPERIENCE GENERATION
# =========================================================
@patch("app.routes.ai_routes.generate_experience_description")
def test_ai_generate_experience(mock_generate_exp, client):
    mock_generate_exp.return_value = "Fake AI experience description."
    setup_dummy_with_resume(client) # We just need the login cookie
    
    # ACT: Call the route successfully
    response = client.post("/api/ai/generate-experience", json={
        "role": "Software Engineer",
        "company": "Google"
    })
    
    assert response.status_code == 200
    assert response.get_json()["description"] == "Fake AI experience description."

def test_ai_generate_experience_missing_fields(client):
    setup_dummy_with_resume(client)
    
    # ACT: Forget to send the "company"
    response = client.post("/api/ai/generate-experience", json={
        "role": "Software Engineer"
    })
    
    # ASSERT: The Bouncer should block it with a 400 error!
    assert response.status_code == 400

# =========================================================
# 3. TEST AI PROJECT GENERATION
# =========================================================
@patch("app.routes.ai_routes.generate_project_description")
def test_ai_generate_project(mock_generate_proj, client):
    mock_generate_proj.return_value = "Fake AI project description."
    setup_dummy_with_resume(client)
    
    response = client.post("/api/ai/generate-project", json={
        "title": "Resume Builder App"
    })
    
    assert response.status_code == 200
    assert response.get_json()["description"] == "Fake AI project description."

def test_ai_generate_project_missing_fields(client):
    setup_dummy_with_resume(client)
    
    # ACT: Send an empty package
    response = client.post("/api/ai/generate-project", json={})
    
    assert response.status_code == 400