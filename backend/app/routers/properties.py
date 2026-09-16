from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from .. import config, models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/properties", tags=["properties"])


def _primary_image(prop: models.Property) -> Optional[str]:
    for img in prop.images:
        if img.is_primary:
            return img.image_url
    return prop.images[0].image_url if prop.images else None


def _to_card(prop: models.Property) -> schemas.PropertyCardOut:
    return schemas.PropertyCardOut(
        id=prop.id, title=prop.title, slug=prop.slug,
        listing_type=prop.listing_type, property_type=prop.property_type,
        status=prop.status, price=prop.price, price_display=prop.price_display,
        locality=prop.locality, city=prop.city, bedrooms=prop.bedrooms,
        bathrooms=prop.bathrooms, area_sqft=prop.area_sqft, featured=prop.featured,
        primary_image=_primary_image(prop),
    )


@router.get("", response_model=schemas.PaginatedProperties)
def list_properties(
    db: Session = Depends(get_db),
    listing_type: Optional[str] = None,
    property_type: Optional[str] = None,
    locality: Optional[str] = None,
    q: Optional[str] = Query(None, description="Free-text search"),
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bedrooms: Optional[int] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    furnishing_status: Optional[str] = None,
    parking: Optional[str] = None,
    featured: Optional[bool] = None,
    sort: str = Query("newest", description="newest|oldest|price_asc|price_desc|area_asc|area_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(config.DEFAULT_PAGE_SIZE, ge=1, le=config.MAX_PAGE_SIZE),
):
    query = db.query(models.Property).options(joinedload(models.Property.images))
    query = query.filter(models.Property.published.is_(True))

    if listing_type:
        query = query.filter(models.Property.listing_type == listing_type)
    if property_type:
        query = query.filter(models.Property.property_type == property_type)
    if locality:
        query = query.filter(models.Property.locality.ilike(f"%{locality}%"))
    if min_price is not None:
        query = query.filter(models.Property.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Property.price <= max_price)
    if bedrooms is not None:
        query = query.filter(models.Property.bedrooms == bedrooms)
    if min_area is not None:
        query = query.filter(models.Property.area_sqft >= min_area)
    if max_area is not None:
        query = query.filter(models.Property.area_sqft <= max_area)
    if furnishing_status:
        query = query.filter(models.Property.furnishing_status == furnishing_status)
    if parking:
        query = query.filter(models.Property.parking.ilike(f"%{parking}%"))
    if featured is not None:
        query = query.filter(models.Property.featured.is_(featured))
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            models.Property.title.ilike(like),
            models.Property.locality.ilike(like),
            models.Property.description.ilike(like),
        ))

    sort_map = {
        "newest": models.Property.created_at.desc(),
        "oldest": models.Property.created_at.asc(),
        "price_asc": models.Property.price.asc(),
        "price_desc": models.Property.price.desc(),
        "area_asc": models.Property.area_sqft.asc(),
        "area_desc": models.Property.area_sqft.desc(),
    }
    query = query.order_by(sort_map.get(sort, sort_map["newest"]))

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return schemas.PaginatedProperties(
        items=[_to_card(p) for p in items],
        total=total, page=page, page_size=page_size,
        total_pages=max(1, ceil(total / page_size)),
    )


@router.get("/{slug}", response_model=schemas.PropertyDetailOut)
def get_property(slug: str, db: Session = Depends(get_db)):
    prop = (
        db.query(models.Property)
        .options(joinedload(models.Property.images), joinedload(models.Property.amenities))
        .filter(models.Property.slug == slug, models.Property.published.is_(True))
        .first()
    )
    if not prop:
        raise HTTPException(404, "Property not found")

    # Enforce location privacy: strip coordinates unless explicitly exact/approximate.
    lat, lng = prop.latitude, prop.longitude
    if prop.location_privacy == "locality_only":
        lat, lng = None, None
    elif prop.location_privacy == "approximate":
        lat = round(float(lat), 2) if lat is not None else None
        lng = round(float(lng), 2) if lng is not None else None

    data = schemas.PropertyDetailOut.model_validate(prop)
    data.latitude, data.longitude = lat, lng
    data.amenities = [a.amenity_name for a in prop.amenities]
    return data
