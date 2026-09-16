def make_property_payload(**overrides):
    payload = {
        "title": "2 BHK Apartment", "description": "A nice flat",
        "property_type": "apartment", "listing_type": "buy", "status": "available",
        "price": 8500000, "locality": "Majiwada", "city": "Thane", "district": "Thane",
        "published": False, "featured": False, "amenities": ["Lift", "Security"], "images": [],
    }
    payload.update(overrides)
    return payload


def test_create_property_requires_auth(client):
    res = client.post("/api/admin/properties", json=make_property_payload())
    assert res.status_code == 401


def test_create_property_success(authed_client):
    res = authed_client.post("/api/admin/properties", json=make_property_payload())
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == "2 BHK Apartment"
    assert body["slug"]  # auto-generated
    assert set(body["amenities"]) == {"Lift", "Security"}


def test_slug_collision_gets_suffixed(authed_client):
    res1 = authed_client.post("/api/admin/properties", json=make_property_payload())
    res2 = authed_client.post("/api/admin/properties", json=make_property_payload())
    slug1 = res1.json()["slug"]
    slug2 = res2.json()["slug"]
    assert slug1 != slug2
    assert slug2 == f"{slug1}-2"


def test_unpublished_property_not_in_public_list(client, authed_client):
    authed_client.post("/api/admin/properties", json=make_property_payload(published=False))
    res = client.get("/api/properties")
    assert res.status_code == 200
    assert res.json()["total"] == 0


def test_published_property_appears_in_public_list(client, authed_client):
    authed_client.post("/api/admin/properties", json=make_property_payload(published=True))
    res = client.get("/api/properties")
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["title"] == "2 BHK Apartment"


def test_public_list_filters_by_locality(client, authed_client):
    authed_client.post("/api/admin/properties", json=make_property_payload(published=True, locality="Majiwada"))
    authed_client.post("/api/admin/properties", json=make_property_payload(published=True, locality="Kolshet", title="Villa in Kolshet"))

    res = client.get("/api/properties", params={"locality": "Kolshet"})
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["locality"] == "Kolshet"


def test_public_list_filters_by_price_range(client, authed_client):
    authed_client.post("/api/admin/properties", json=make_property_payload(published=True, price=5000000, title="Cheaper"))
    authed_client.post("/api/admin/properties", json=make_property_payload(published=True, price=15000000, title="Pricier"))

    res = client.get("/api/properties", params={"min_price": 10000000})
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Pricier"


def test_property_detail_by_slug(client, authed_client):
    created = authed_client.post("/api/admin/properties", json=make_property_payload(published=True)).json()
    res = client.get(f"/api/properties/{created['slug']}")
    assert res.status_code == 200
    assert res.json()["title"] == "2 BHK Apartment"


def test_property_detail_404_for_unpublished(client, authed_client):
    created = authed_client.post("/api/admin/properties", json=make_property_payload(published=False)).json()
    res = client.get(f"/api/properties/{created['slug']}")
    assert res.status_code == 404


def test_toggle_publish(authed_client):
    created = authed_client.post("/api/admin/properties", json=make_property_payload(published=False)).json()
    res = authed_client.patch(f"/api/admin/properties/{created['id']}/publish", params={"published": "true"})
    assert res.status_code == 200
    assert res.json()["published"] is True


def test_delete_property(authed_client):
    created = authed_client.post("/api/admin/properties", json=make_property_payload()).json()
    res = authed_client.delete(f"/api/admin/properties/{created['id']}")
    assert res.status_code == 204

    res2 = authed_client.get("/api/admin/properties")
    assert len(res2.json()) == 0


def test_location_privacy_hides_coordinates_when_locality_only(client, authed_client):
    created = authed_client.post("/api/admin/properties", json=make_property_payload(
        published=True, latitude=19.2183, longitude=72.9781, location_privacy="locality_only",
    )).json()
    res = client.get(f"/api/properties/{created['slug']}")
    assert res.json()["latitude"] is None
    assert res.json()["longitude"] is None


def test_location_privacy_shows_exact_coordinates(client, authed_client):
    created = authed_client.post("/api/admin/properties", json=make_property_payload(
        published=True, latitude=19.2183, longitude=72.9781, location_privacy="exact",
    )).json()
    res = client.get(f"/api/properties/{created['slug']}")
    # Decimal fields serialize as precise strings (e.g. "19.2183000"), not
    # bare floats — compare numerically rather than assuming JSON shape.
    assert float(res.json()["latitude"]) == 19.2183
