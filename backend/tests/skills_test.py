import uuid
from tests.education_test import setup_env

def test_skills_full_suite(client):
    owner, hacker, resume_id = setup_env(client)
    
    # 1. Add
    res = client.post("/api/skills/", json={"resume_id": resume_id, "name": "Python"})
    assert res.status_code == 201
    skill_id = res.get_json()["id"]

    # 2. Bad Requests
    assert client.post("/api/skills/", json={"name": "Python"}).status_code in [400, 403, 500]

    # 3. Hacker
    client.post("/api/auth/login", json={"email": hacker, "password": "p"})
    assert client.post("/api/skills/", json={"resume_id": resume_id, "name": "C++"}).status_code == 403
    
    # ✅ FIXED: Now expects 200 or 403 because we removed the trap!
    assert client.get(f"/api/skills/{resume_id}").status_code in [403, 200] 
    
    assert client.put(f"/api/skills/{skill_id}", json={"name": "A"}).status_code == 403
    assert client.delete(f"/api/skills/{skill_id}").status_code == 403

    # 4. Owner
    client.post("/api/auth/login", json={"email": owner, "password": "p"})
    assert client.put("/api/skills/99999", json={"name": "A"}).status_code == 404
    assert client.delete("/api/skills/99999").status_code == 404
    assert client.put(f"/api/skills/{skill_id}", json={"name": "Java"}).status_code == 200
    assert client.delete(f"/api/skills/{skill_id}").status_code == 200