def test_login_success(client, admin_user):
    res = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "testpassword123"})
    assert res.status_code == 200
    assert res.cookies.get("happyhouse_session")
    assert res.cookies.get("happyhouse_csrf")


def test_login_wrong_password(client, admin_user):
    res = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "wrongpassword"})
    assert res.status_code == 401


def test_login_unknown_email_same_error_as_wrong_password(client, admin_user):
    """The error message/status must not reveal whether the email exists."""
    res = client.post("/api/auth/login", json={"email": "nobody@test.com", "password": "anything123"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password"


def test_login_rate_limited_after_five_attempts(client, admin_user):
    for _ in range(5):
        res = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "wrong"})
        assert res.status_code == 401
    res = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "wrong"})
    assert res.status_code == 429


def test_admin_route_requires_auth(client):
    res = client.get("/api/admin/properties")
    assert res.status_code == 401


def test_mutating_admin_route_without_csrf_header_rejected(client, admin_user):
    client.post("/api/auth/login", json={"email": "admin@test.com", "password": "testpassword123"})
    # Deliberately not attaching X-CSRF-Token
    res = client.put("/api/admin/settings", json={"business_name": "New Name"})
    assert res.status_code == 403


def test_mutating_admin_route_with_csrf_header_succeeds(authed_client):
    res = authed_client.put("/api/admin/settings", json={"business_name": "New Name"})
    assert res.status_code == 200
    assert res.json()["business_name"] == "New Name"


def test_logout_clears_session(authed_client):
    res = authed_client.post("/api/auth/logout")
    assert res.status_code == 200
    # A subsequent admin call should now be unauthenticated again
    res2 = authed_client.get("/api/admin/properties")
    assert res2.status_code == 401


def test_change_password_wrong_current_password_rejected(authed_client):
    res = authed_client.put("/api/auth/change-password", json={
        "current_password": "notthecurrentpassword",
        "new_password": "brandnewpassword123",
    })
    assert res.status_code == 401


def test_change_password_success_and_can_login_with_new_password(authed_client, client, admin_user):
    res = authed_client.put("/api/auth/change-password", json={
        "current_password": "testpassword123",
        "new_password": "brandnewpassword123",
    })
    assert res.status_code == 200

    login_res = client.post("/api/auth/login", json={"email": admin_user.email, "password": "brandnewpassword123"})
    assert login_res.status_code == 200
