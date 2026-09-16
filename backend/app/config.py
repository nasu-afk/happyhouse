"""
Centralized app configuration. All secrets/config come from environment
variables — never hardcoded, never committed (see spec §41).
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()  # populates os.environ from backend/.env when present

# --- Auth ---
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(hours=12)
COOKIE_NAME = "happyhouse_session"
CSRF_COOKIE_NAME = "happyhouse_csrf"
COOKIE_SECURE = os.getenv("ENV", "development") == "production"
# "lax" works fine for local dev (frontend/backend on different localhost
# ports are still treated as the same "site"). Once frontend and backend
# live on genuinely different domains (e.g. separate Railway services,
# each with their own *.up.railway.app subdomain), cookies are cross-site
# and need "none" — which browsers only allow when Secure=True, i.e. HTTPS
# on both sides.
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")

# --- CORS ---
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# --- Image storage (Cloudinary) ---
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
MAX_IMAGE_SIZE_MB = 8
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}

# --- Pagination ---
DEFAULT_PAGE_SIZE = 12
MAX_PAGE_SIZE = 48

if not JWT_SECRET_KEY:
    # Fail loudly in production rather than silently using an insecure default.
    if os.getenv("ENV") == "production":
        raise RuntimeError("JWT_SECRET_KEY must be set in production")
    JWT_SECRET_KEY = "dev-only-insecure-secret-change-me"
