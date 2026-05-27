# tests/auth_test.py
import pytest
from unittest.mock import patch
from app.extensions import db
from app.models.user import User
from datetime import datetime, timedelta
import secrets
import uuid

# =========================================================
# HELPER: Setup a fresh user
# =========================================================
def setup_user(client):
    email = f"auth_{uuid.uuid4()}@test.com"
    client.post("/api/auth/register", json={"name": "Test", "email": email, "password": "pass"})
    return email

# =========================================================
# 1. HAPPY PATHS (Basic Auth & Admin)
# =========================================================
def test_auth_happy_paths(client):
    email = setup_user(client)
    
    # Login
    log_res = client.post("/api/auth/login", json={"email": email, "password": "pass"})
    assert log_res.status_code == 200
    
    # Check Auth & Profile
    assert client.get("/api/auth/check-auth").status_code == 200
    assert client.get("/api/auth/me").status_code == 200
    assert client.get("/api/auth/profile").status_code == 200
    
    # Admin Test (Convert to Admin via backdoor)
    with client.application.app_context():
        user = User.query.filter_by(email=email).first()
        user.role = "admin"
        db.session.commit()
    
    # Now Admin Test should succeed!
    # (Need to login again to get the new 'admin' role inside the JWT cookie)
    client.post("/api/auth/login", json={"email": email, "password": "pass"})
    assert client.get("/api/auth/admin-test").status_code == 200
    
    # Logout
    assert client.post("/api/auth/logout").status_code == 200

# =========================================================
# 2. CHAOS MONKEY: 400 & 401 ERRORS (Bad Inputs)
# =========================================================
def test_auth_bad_requests(client):
    email = setup_user(client)
    
    # REGISTER: Missing fields
    assert client.post("/api/auth/register", json={"name": "Only Name"}).status_code == 400
    assert client.post("/api/auth/register", json={"email": email, "password": "pass"}).status_code == 400 # Email exists
    
    # LOGIN: Missing fields, wrong email, wrong pass
    assert client.post("/api/auth/login", json={"email": email}).status_code == 400
    assert client.post("/api/auth/login", json={"email": "fake@test.com", "password": "pass"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": email, "password": "WRONG"}).status_code == 401

# =========================================================
# 3. CHAOS MONKEY: GHOST USER (/me 404)
# =========================================================
def test_auth_ghost_user(client):
    email = setup_user(client)
    client.post("/api/auth/login", json={"email": email, "password": "pass"})
    
    # Logged in! Now delete the user from the database directly
    with client.application.app_context():
        user = User.query.filter_by(email=email).first()
        db.session.delete(user)
        db.session.commit()
        
    # The cookie exists, but the user is gone!
    assert client.get("/api/auth/me").status_code == 404

# =========================================================
# 4. FORGOT & RESET PASSWORD (All Scenarios)
# =========================================================
@patch("app.routes.auth_routes.mail.send")
def test_password_reset_flow(mock_mail, client):
    mock_mail.return_value = True
    email = setup_user(client)
    
    # 1. Forgot Pass: Missing email
    assert client.post("/api/auth/forgot-password", json={}).status_code == 400
    
    # 2. Forgot Pass: Fake email (Should return 200 for security reasons!)
    assert client.post("/api/auth/forgot-password", json={"email": "nobody@test.com"}).status_code == 200
    
    # 3. Forgot Pass: Success
    assert client.post("/api/auth/forgot-password", json={"email": email}).status_code == 200
    
    # 4. Get the token from DB
    with client.application.app_context():
        token = User.query.filter_by(email=email).first().reset_token
        
    # 5. Reset Pass: Missing password
    assert client.post(f"/api/auth/reset-password/{token}", json={}).status_code == 400
    
    # 6. Reset Pass: Invalid Token
    assert client.post("/api/auth/reset-password/fake_token", json={"password": "new"}).status_code == 400
    
    # 7. Reset Pass: Expired Token
    with client.application.app_context():
        user = User.query.filter_by(email=email).first()
        user.reset_token_expiry = datetime.utcnow() - timedelta(minutes=20) # Expired in the past!
        db.session.commit()
    assert client.post(f"/api/auth/reset-password/{token}", json={"password": "new"}).status_code == 400

# =========================================================
# 5. CHAOS MONKEY: 500 SERVER ERRORS (Catastrophic Crashes)
# =========================================================

@patch("app.routes.auth_routes.User.query")
def test_login_500(mock_query, client):
    mock_query.filter_by.side_effect = Exception("DB Down")
    assert client.post("/api/auth/login", json={"email": "e@test.com", "password": "p"}).status_code == 500

@patch("app.routes.auth_routes.make_response", side_effect=Exception("Response Failed"))
def test_logout_500(mock_response, client):
    assert client.post("/api/auth/logout").status_code == 500

@patch("app.routes.auth_routes.get_jwt_identity", side_effect=Exception("JWT Exploded"))
def test_protected_routes_exceptions(mock_jwt, client):
    # Need to be logged in so the decorator lets us inside the function
    email = setup_user(client)
    client.post("/api/auth/login", json={"email": email, "password": "pass"})
    
    assert client.get("/api/auth/check-auth").status_code == 401
    assert client.get("/api/auth/me").status_code == 401

@patch("app.routes.auth_routes.mail.send", side_effect=Exception("Mail Server Down"))
def test_forgot_password_500(mock_mail, client):
    email = setup_user(client)
    assert client.post("/api/auth/forgot-password", json={"email": email}).status_code == 500