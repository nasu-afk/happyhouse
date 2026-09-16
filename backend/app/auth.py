"""
Authentication: password hashing + JWT-in-secure-cookie session auth.
"""
import secrets
from datetime import datetime, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import config, models
from .database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def generate_csrf_token() -> str:
    return secrets.token_hex(32)


def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + config.ACCESS_TOKEN_EXPIRE,
    }
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
        return int(payload["sub"])
    except jwt.PyJWTError:
        return None


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """
    Dependency for protected admin routes. Reads the session cookie,
    validates the JWT, and loads an active user — or raises 401.
    """
    token = request.cookies.get(config.COOKIE_NAME)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired session")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account inactive or not found")

    return user


def verify_csrf(request: Request) -> None:
    """
    Dependency for state-changing admin routes (POST/PUT/PATCH/DELETE).

    Double-submit cookie pattern: the login response sets a CSRF token in a
    *non*-httpOnly cookie (so frontend JS can read it) alongside the
    httpOnly session cookie. The frontend echoes that value back in an
    X-CSRF-Token header on every mutating request. A cross-site attacker
    can piggyback on the browser's cookies automatically, but can't read
    the cookie's value to also set the matching header — so a mismatch or
    missing header means the request didn't originate from our own
    frontend's JavaScript.

    GET requests are exempt — they're expected to be side-effect-free, so
    the get_current_user dependency alone is enough for those.
    """
    cookie_token = request.cookies.get(config.CSRF_COOKIE_NAME)
    header_token = request.headers.get("X-CSRF-Token")

    if not cookie_token or not header_token or not secrets.compare_digest(cookie_token, header_token):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Missing or invalid CSRF token")
