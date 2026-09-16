def make_property(authed_client, **overrides):
    payload = {
        "title": "2 BHK Apartment", "property_type": "apartment", "listing_type": "buy",
        "price": 8500000, "locality": "Majiwada", "city": "Thane", "district": "Thane",
        "published": True,
    }
    payload.update(overrides)
    return authed_client.post("/api/admin/properties", json=payload).json()


def test_submit_general_enquiry(client):
    res = client.post("/api/enquiries", json={
        "name": "Priya", "phone": "9876543210", "message": "Interested in a 2BHK", "enquiry_type": "general",
    })
    assert res.status_code == 201
    assert res.json()["status"] == "new"


def test_submit_property_enquiry_requires_published_property(client, authed_client):
    unpublished = make_property(authed_client, published=False)
    res = client.post("/api/enquiries", json={
        "property_id": unpublished["id"], "name": "Priya", "phone": "9876543210", "enquiry_type": "property",
    })
    assert res.status_code == 400


def test_submit_property_enquiry_success(client, authed_client):
    prop = make_property(authed_client, published=True)
    res = client.post("/api/enquiries", json={
        "property_id": prop["id"], "name": "Priya", "phone": "9876543210", "enquiry_type": "property",
    })
    assert res.status_code == 201


def test_enquiry_rate_limited_after_ten_per_hour(client):
    for _ in range(10):
        res = client.post("/api/enquiries", json={"name": "XX", "phone": "9876543210", "enquiry_type": "general"})
        assert res.status_code == 201
    res = client.post("/api/enquiries", json={"name": "XX", "phone": "9876543210", "enquiry_type": "general"})
    assert res.status_code == 429


def test_enquiries_list_requires_auth(client):
    res = client.get("/api/admin/enquiries")
    assert res.status_code == 401


def test_admin_can_see_and_update_enquiry_status(client, authed_client):
    client.post("/api/enquiries", json={"name": "Priya", "phone": "9876543210", "enquiry_type": "general"})

    listed = authed_client.get("/api/admin/enquiries").json()
    assert len(listed) == 1
    assert listed[0]["status"] == "new"

    res = authed_client.patch(f"/api/admin/enquiries/{listed[0]['id']}", json={"status": "contacted"})
    assert res.status_code == 200
    assert res.json()["status"] == "contacted"


def test_update_enquiry_status_without_csrf_rejected(client, authed_client):
    client.post("/api/enquiries", json={"name": "Priya", "phone": "9876543210", "enquiry_type": "general"})
    enquiry_id = authed_client.get("/api/admin/enquiries").json()[0]["id"]

    # authed_client normally has X-CSRF-Token pre-attached; override it
    # with a blank value for this one request to prove enforcement works.
    res = authed_client.patch(
        f"/api/admin/enquiries/{enquiry_id}", json={"status": "contacted"}, headers={"X-CSRF-Token": ""}
    )
    assert res.status_code == 403
