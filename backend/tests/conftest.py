"""
Shared pytest fixtures.

Uses an in-memory SQLite database instead of MySQL for tests — fast, no
external service required, and SQLAlchemy's generic column types (Enum,
JSON, Numeric, etc.) all have SQLite-compatible implementations. The one
thing SQLite can't replicate is the MySQL-specific FULLTEXT index in
schema.sql, but that's raw DDL applied outside the ORM (not part of
models.py), so it never comes up in these tests.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-not-for-production")
os.environ.setdefault("ENV", "development")

from app.database import Base, get_db
from app import models, auth
import app.main as main_module


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    main_module.app.dependency_overrides[get_db] = override_get_db
    # Rate-limit storage is process-wide (keyed by client IP) and would
    # otherwise leak between test functions since TestClient always uses
    # the same fake IP — reset it so each test starts with a clean slate.
    main_module.limiter.reset()

    with TestClient(main_module.app) as test_client:
        yield test_client

    main_module.app.dependency_overrides.clear()


@pytest.fixture()
def admin_user(db_session):
    user = models.User(
        name="Test Admin", email="admin@test.com",
        password_hash=auth.hash_password("testpassword123"),
        role="owner", is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def authed_client(client, admin_user):
    """A TestClient already logged in, with CSRF header pre-attached to
    every subsequent request via a transport-level header default."""
    res = client.post("/api/auth/login", json={"email": admin_user.email, "password": "testpassword123"})
    assert res.status_code == 200
    csrf_token = client.cookies.get("happyhouse_csrf")
    client.headers.update({"X-CSRF-Token": csrf_token})
    return client
