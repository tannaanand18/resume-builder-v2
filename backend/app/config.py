import os
from dotenv import load_dotenv
from datetime import timedelta
load_dotenv()

def _is_production_env():
    return any([
        os.getenv("FLASK_ENV") == "production",
        os.getenv("RENDER"),
        os.getenv("RAILWAY_ENVIRONMENT"),
        os.getenv("RAILWAY_PUBLIC_DOMAIN"),
        os.getenv("RAILWAY_PROJECT_ID"),
    ])

is_prod = _is_production_env()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # SSL for Aiven MySQL
    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {
            "ssl_disabled": False
        },
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwtsecret")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_ACCESS_COOKIE_NAME = "access_token_cookie"
    JWT_COOKIE_SAMESITE = "None" if is_prod else "Lax"
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_COOKIE_SECURE = is_prod
    JWT_COOKIE_CSRF_PROTECT = False

    # Mail configuration
    MAIL_SERVER = os.getenv("MAIL_SERVER")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER")