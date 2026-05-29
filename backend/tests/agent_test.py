import uuid

from app.extensions import db
from app.models.skills import Skill


def _register_and_login(client):
    email = f"agent_{uuid.uuid4()}@test.com"
    password = "pass123"

    register_res = client.post(
        "/api/auth/register",
        json={"name": "Agent User", "email": email, "password": password},
    )
    assert register_res.status_code == 201

    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200

    return email


def _create_resume(client, title="Agent Test Resume"):
    response = client.post(
        "/api/resume/",
        json={"title": title, "summary": ""},
    )
    assert response.status_code == 201
    return response.get_json()["resume_id"]


def test_ai_agent_add_skill(client):
    _register_and_login(client)
    resume_id = _create_resume(client)

    response = client.post(
        "/api/ai/agent",
        json={
            "message": "Add skill: Python (Advanced)",
            "resume_id": resume_id,
            "conversation_history": [],
            "context": {"current_page": "resume_builder"},
        },
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert "added" in payload["message"].lower()
    assert payload["actions_taken"]

    with client.application.app_context():
        skill = Skill.query.filter_by(resume_id=resume_id, skill_name="Python").first()
        assert skill is not None
        assert skill.level == "Advanced"
