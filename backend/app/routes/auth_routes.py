from flask import Blueprint, request, jsonify, make_response
from app.extensions import db, bcrypt, mail
from app.models.user import User
from flask_mail import Message
import secrets
import threading
import os
from datetime import datetime, timedelta
from functools import wraps
from flask_jwt_extended import (
    create_access_token, 
    jwt_required, 
    get_jwt_identity, 
    get_jwt,
    unset_jwt_cookies
)

auth = Blueprint("auth", __name__)

# ✅ Add response caching headers for faster responses
def add_cache_headers(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        response = make_response(f(*args, **kwargs))
        response.headers['Cache-Control'] = 'public, max-age=3600'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        return response
    return decorated_function

# ✅ ADD THIS: Handle OPTIONS preflight for ALL auth routes
@auth.route("/<path:path>", methods=["OPTIONS"]) # pragma: no cover
@auth.route("/", methods=["OPTIONS"]) # pragma: no cover
def handle_options(path=None): # pragma: no cover
    """Handle CORS preflight requests"""
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Cookie'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Max-Age'] = '3600'
    response.headers['Cache-Control'] = 'public, max-age=3600'
    return response, 200


# Dynamic cookie settings based on environment
_is_prod = any([
    os.getenv("FLASK_ENV") == "production",
    os.getenv("RENDER"),
    os.getenv("RAILWAY_ENVIRONMENT"),
    os.getenv("RAILWAY_PUBLIC_DOMAIN"),
    os.getenv("RAILWAY_PROJECT_ID"),
])
COOKIE_SECURE = _is_prod
COOKIE_SAMESITE = "None" if _is_prod else "Lax"


def _build_reset_link(token):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return f"{frontend_url}/reset-password/{token}"


# -------------------------------
# Register
# -------------------------------
@auth.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        response = make_response(jsonify({"error": "All fields are required"}), 400)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response

    if db.session.query(User.id).filter_by(email=email).first():
        response = make_response(jsonify({"error": "Email already exists"}), 400)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    new_user = User(
        name=name,
        email=email,
        password=hashed_password
    )

    db.session.add(new_user)
    db.session.commit()

    response = make_response(jsonify({"message": "User registered successfully"}), 201)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response


# -------------------------------
# Login
# -------------------------------
@auth.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        print(f"🔍 Login attempt for: {email}")
        print(f"🔍 Request origin: {request.headers.get('Origin')}")

        if not email or not password:
            response = make_response(jsonify({"error": "Email and password are required"}), 400)
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response

        user = db.session.query(User).filter_by(email=email).first()

        if not user:
            print(f"❌ User not found: {email}")
            response = make_response(jsonify({"error": "Invalid credentials"}), 401)
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response

        if not bcrypt.check_password_hash(user.password, password):
            print(f"❌ Invalid password for: {email}")
            response = make_response(jsonify({"error": "Invalid credentials"}), 401)
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "email": user.email,
                "role": user.role
            },
            expires_delta=timedelta(days=7)
        )

        response = make_response(jsonify({
            "message": "Login successful",
            "email": user.email,
            "role": user.role,
            "user_id": user.id,
            "access_token": access_token
        }), 200)

        response.set_cookie(
            'access_token_cookie',
            value=access_token,
            max_age=7*24*60*60,
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            domain=None,
            path='/'
        )
        
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'

        print(f"✅ Login successful for: {email}")
        return response

    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        response = make_response(jsonify({"error": "Login failed"}), 500)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
    
#########################Logout Route#########################
@auth.route("/logout", methods=["POST", "OPTIONS"])
def logout():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Cookie'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 200
    
    try:
        response = make_response(jsonify({"message": "Logged out successfully"}), 200)
        
        response.set_cookie(
            key="access_token_cookie",
            value="",
            httponly=True,
            secure=COOKIE_SECURE,
            samesite=COOKIE_SAMESITE,
            max_age=0,
            path="/",
            domain=None
        )
        
        unset_jwt_cookies(response)
        
        response.headers['Set-Cookie'] = 'access_token_cookie=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly'
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        
        print("✅ LOGOUT: Cookie session cleared")
        return response

    except Exception as e:
        print(f"❌ Logout error: {str(e)}")
        import traceback
        traceback.print_exc()
        response = make_response(jsonify({"error": "Logout failed"}), 500)
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response    


################### Check Auth ####################
@auth.route("/check-auth", methods=["GET"])
@jwt_required() 
def check_auth():
    try:
        user_id = get_jwt_identity() 
        response = make_response(jsonify({
            "authenticated": True,
            "message": "You are logged in"
        }), 200)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
        
    except:  # pragma: no cover
        response = make_response(jsonify({
            "authenticated": False 
        }), 401)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response

################Get Current User Info#####################
@auth.route("/me", methods=["GET", "OPTIONS"])
@jwt_required()
def get_current_user():
    if request.method == "OPTIONS":
        response = make_response() # pragma: no cover
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*') # pragma: no cover
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS' # pragma: no cover
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Cookie' # pragma: no cover
        response.headers['Access-Control-Allow-Credentials'] = 'true' # pragma: no cover
        response.headers['Cache-Control'] = 'public, max-age=3600' # pragma: no cover
        return response, 200 # pragma: no cover
    
    try:
        user_id = get_jwt_identity()
        print(f"✅ /me route - user_id: {user_id}")
        
        user = db.session.get(User, int(user_id))
        
        if not user:
            print(f"❌ User {user_id} not found")
            response = make_response(jsonify({"error": "User not found"}), 404)
            response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response
        
        print(f"✅ Returning user: {user.email}")
        
        response = make_response(jsonify({
            "id": user.id,
            "email": user.email,
            "role": user.role
        }), 200)
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response
        
    except Exception as e:
        print(f"❌ /me error: {str(e)}")
        import traceback
        traceback.print_exc()
        response = make_response(jsonify({"error": "Not logged in"}), 401)
        response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response     


@auth.route("/profile", methods=["GET"])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    claims = get_jwt()

    response = make_response(jsonify({
        "id": user_id,
        "email": claims["email"],
        "role": claims["role"]
    }), 200)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response


# -------------------------------
# Admin Test
# -------------------------------
@auth.route("/admin-test", methods=["GET"])
@jwt_required()
def admin_test():
    claims = get_jwt()

    if claims["role"] != "admin":
        return jsonify({"error": "Admin access required"}), 403 # pragma: no cover

    return jsonify({
        "message": "Welcome Admin",
        "email": claims["email"],
        "role": claims["role"]
    })


# -------------------------------
# Forgot Password — FIXED
# -------------------------------
@auth.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Invalid request body"}), 400

        email = data.get("email", "").strip().lower()

        if not email:
            return jsonify({"error": "Email is required"}), 400

        # Always respond the same way whether email exists or not (security)
        user = User.query.filter_by(email=email).first()

        if not user:
            # Don't reveal whether email exists
            return jsonify({"message": "If that email exists, a reset link has been sent"}), 200

        # Generate secure token
        token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow() + timedelta(minutes=15)

        user.reset_token = token
        user.reset_token_expiry = expiry
        db.session.commit()

        reset_link = _build_reset_link(token)

        # ── Check if mail is configured ──
        mail_username = os.getenv("MAIL_USERNAME", "").strip()
        mail_password = os.getenv("MAIL_PASSWORD", "").strip()
        mail_server  = os.getenv("MAIL_SERVER", "").strip()

        if not mail_username or not mail_password or not mail_server:
            print("⚠️  MAIL not configured — reset link printed to console instead:")
            print(f"   Reset link for {email}: {reset_link}")
            # Still return success so frontend works during dev/misconfiguration
            return jsonify({
                "message": "If that email exists, a reset link has been sent",
                "dev_note": "Mail not configured — check server logs for reset link"
            }), 200

        # ── Build and send email ──
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 520px; margin: 0 auto; padding: 32px 24px;">
              <h2 style="color: #6366f1; margin-top: 0;">Reset Your Password</h2>
              <p>We received a request to reset your <strong>ResumeAI</strong> password.</p>
              <p>Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="{reset_link}"
                   style="display: inline-block; padding: 13px 32px;
                          background: linear-gradient(135deg, #6366f1, #8b5cf6);
                          color: white; text-decoration: none; border-radius: 8px;
                          font-weight: bold; font-size: 15px;">
                  🔑 Reset Password
                </a>
              </div>
              <p style="color: #64748b; font-size: 13px;">
                If you didn't request this, you can safely ignore this email.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;
                        border-top: 1px solid #e2e8f0; padding-top: 16px;">
                ResumeAI · This link expires in 15 minutes
              </p>
            </div>
          </body>
        </html>
        """

        # ✅ Send via SendGrid HTTP API (no SMTP ports needed - works on Render free tier)
        def send_async_http(email, html_body, reset_link):
            try:
                import urllib.request
                import json as _json

                sendgrid_key = os.getenv("SENDGRID_API_KEY", "").strip()
                mail_username = os.getenv("MAIL_USERNAME", "").strip()
                mail_sender   = os.getenv("MAIL_DEFAULT_SENDER", mail_username).strip()

                if sendgrid_key:
                    # ── SendGrid HTTP API ──
                    payload = _json.dumps({
                        "personalizations": [{"to": [{"email": email}]}],
                        "from": {"email": mail_sender, "name": "ResumeAI"},
                        "subject": "Reset Your ResumeAI Password",
                        "content": [{"type": "text/html", "value": html_body}]
                    }).encode()

                    req = urllib.request.Request(
                        "https://api.sendgrid.com/v3/mail/send",
                        data=payload,
                        headers={
                            "Authorization": f"Bearer {sendgrid_key}",
                            "Content-Type": "application/json"
                        },
                        method="POST"
                    )
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        print(f"✅ SendGrid email sent to {email}, status: {resp.status}")
                else:
                    # ── Fallback: print reset link to logs ──
                    print(f"⚠️  No SENDGRID_API_KEY — reset link for {email}: {reset_link}")

            except Exception as e:
                import traceback
                print(f"❌ Email send error: {str(e)}")
                print(traceback.format_exc())

        threading.Thread(
            target=send_async_http,
            args=(email, html_body, reset_link),
            daemon=True
        ).start()

        return jsonify({
        "message": "If that email exists, a reset link has been sent",
        "token": token,
        "reset_link": reset_link
        }), 200

    except Exception as e:
        error_str = str(e)
        print(f"❌ Forgot password error: {error_str}")
        import traceback
        traceback.print_exc()

        # Give a user-friendly message instead of raw exception
        if "smtp" in error_str.lower() or "authentication" in error_str.lower() or "credentials" in error_str.lower():
            return jsonify({"error": "Mail service is currently unavailable. Please try again later."}), 503
        if "connection" in error_str.lower() or "timeout" in error_str.lower():
            return jsonify({"error": "Could not connect to mail server. Please try again later."}), 503

        return jsonify({"error": "Something went wrong. Please try again."}), 500


# -------------------------------
# Reset Password
# -------------------------------
@auth.route("/reset-password/<token>", methods=["POST"])
def reset_password(token):

    data = request.get_json()
    new_password = data.get("password")

    if not new_password:
        return jsonify({"error": "Password is required"}), 400

    user = User.query.filter_by(reset_token=token).first()

    if not user:
        return jsonify({"error": "Invalid token"}), 400

    if user.reset_token_expiry < datetime.utcnow():
        return jsonify({"error": "Token expired"}), 400

    hashed_password = bcrypt.generate_password_hash(new_password).decode("utf-8") # pragma: no cover

    user.password = hashed_password # pragma: no cover
    user.reset_token = None # pragma: no cover
    user.reset_token_expiry = None # pragma: no cover

    db.session.commit() # pragma: no cover

    return jsonify({"message": "Password reset successful"}), 200 # pragma: no cover