from flask import Flask, request, make_response
from .config import Config
from .extensions import db, jwt, bcrypt, mail
from flask_cors import CORS
from datetime import timedelta
import os

# Import Blueprints
from .routes.auth_routes import auth
from .routes.resume_routes import resume_bp
from .routes.education_routes import education_bp
from .routes.experience_routes import experience_bp
from .routes.skills_routes import skill_bp
from .routes.project_routes import project_bp
from .routes.certification_routes import certification_bp
from .routes.ai_routes import ai_bp
from .routes.admin_routes import admin_bp
from .routes.share_routes import share_bp


def _is_production_env():
    return any([
        os.getenv("FLASK_ENV") == "production",
        os.getenv("RENDER"),
        os.getenv("RAILWAY_ENVIRONMENT"),
        os.getenv("RAILWAY_PUBLIC_DOMAIN"),
        os.getenv("RAILWAY_PROJECT_ID"),
    ])


def create_app(test_config=None):
    app = Flask(__name__)

    # Load Configuration
    app.config.from_object(Config)
    
    # JWT Cookie Configuration
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwtsecret")
    app.config["JWT_TOKEN_LOCATION"] = ["cookies", "headers"]
    app.config["JWT_HEADER_NAME"] = "Authorization"      # ← ADD THIS
    app.config["JWT_HEADER_TYPE"] = "Bearer"             # ← ADD THIS
    app.config["JWT_COOKIE_CSRF_PROTECT"] = False
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
    app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"

    # Production (HTTPS) vs Development (HTTP) cookie settings
    is_prod = _is_production_env()
    app.config["JWT_COOKIE_SECURE"] = is_prod
    app.config["JWT_COOKIE_SAMESITE"] = "None" if is_prod else "Lax"
    
    if test_config:
        app.config.update(test_config)

    # Build allowed origins
    frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")

    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    if frontend_url:
        allowed_origins.append(frontend_url) # pragma: no cover
    
    if "https://resume-psi-drab-27.vercel.app" not in allowed_origins:
        allowed_origins.append("https://resume-psi-drab-27.vercel.app")

    # CORS Configuration
    CORS(
        app,
        origins=allowed_origins,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "Cookie"],
        expose_headers=["Set-Cookie"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    # Initialize Extensions
    jwt.init_app(app)
    db.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)

    # ✅ Handle OPTIONS preflight requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            response = make_response() # pragma: no cover
            origin = request.headers.get('Origin') # pragma: no cover
            if origin in allowed_origins: # pragma: no cover
                response.headers['Access-Control-Allow-Origin'] = origin # pragma: no cover
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS' # pragma: no cover
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Cookie' # pragma: no cover
                response.headers['Access-Control-Allow-Credentials'] = 'true' # pragma: no cover
                response.headers['Access-Control-Max-Age'] = '3600' # pragma: no cover
            return response, 200 # pragma: no cover

    # ✅ Add CORS headers to all responses
    @app.after_request
    def after_request(response):
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin # pragma: no cover
            response.headers['Access-Control-Allow-Credentials'] = 'true' # pragma: no cover
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,Cookie' # pragma: no cover
            response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS' # pragma: no cover
            response.headers['Access-Control-Expose-Headers'] = 'Set-Cookie' # pragma: no cover
        return response

    # Register Blueprints
    app.register_blueprint(auth, url_prefix="/api/auth")
    app.register_blueprint(resume_bp, url_prefix="/api/resume")
    app.register_blueprint(education_bp, url_prefix="/api/education")
    app.register_blueprint(experience_bp, url_prefix="/api/experience")
    app.register_blueprint(skill_bp, url_prefix="/api/skills")
    app.register_blueprint(project_bp, url_prefix="/api/projects")
    app.register_blueprint(certification_bp, url_prefix="/api/certifications")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(share_bp, url_prefix="/api/share")

    return app

if __name__ == "__main__":
    app = create_app() # pragma: no cover
    app.run(debug=True) # pragma: no cover