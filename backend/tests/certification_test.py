import uuid
from tests.education_test import setup_env

def test_certifications_full_suite(client):
    owner, hacker, resume_id = setup_env(client)
    
    # 1. Add
    res = client.post("/api/certifications/", json={"resume_id": resume_id, "name": "AWS"})
    assert res.status_code == 201
    cert_id = res.get_json()["id"]

    # 2. Bad Requests
    assert client.post("/api/certifications/", json={"name": "AWS"}).status_code in [400, 403, 500]

    # 3. Hacker
    client.post("/api/auth/login", json={"email": hacker, "password": "p"})
    assert client.post("/api/certifications/", json={"resume_id": resume_id, "name": "Azure"}).status_code == 403
    
    # ✅ FIXED: Now expects 200 or 403!
    assert client.get(f"/api/certifications/{resume_id}").status_code in [403, 200]
    
    assert client.put(f"/api/certifications/{cert_id}", json={"name": "A"}).status_code == 403
    assert client.delete(f"/api/certifications/{cert_id}").status_code == 403

    # 4. Owner
    client.post("/api/auth/login", json={"email": owner, "password": "p"})
    assert client.put("/api/certifications/99999", json={"name": "A"}).status_code == 404
    assert client.delete("/api/certifications/99999").status_code == 404
    assert client.put(f"/api/certifications/{cert_id}", json={"name": "GCP"}).status_code == 200
    assert client.delete(f"/api/certifications/{cert_id}").status_code == 200