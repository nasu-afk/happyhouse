import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import auth, config, models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/admin/properties", tags=["admin-properties"])


def slugify(title: str, locality: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", f"{title}-{locality}".lower()).strip("-")
    return base[:200]


def unique_slug(db: Session, base_slug: str, exclude_id: Optional[int] = None) -> str:
    """Append -2, -3, ... on collision (spec §21)."""
    slug = base_slug
    n = 2
    while True:
        query = db.query(models.Property).filter(models.Property.slug == slug)
        if exclude_id:
            query = query.filter(models.Property.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{n}"
        n += 1


@router.get("")
def list_all(db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)):
    """Unfiltered list for the admin table (includes drafts, unpublished, etc.)."""
    props = db.query(models.Property).options(joinedload(models.Property.images)).order_by(
        models.Property.updated_at.desc()
    ).all()
    return props


@router.post("", response_model=schemas.PropertyDetailOut, status_code=201)
def create_property(
    payload: schemas.PropertyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    slug = unique_slug(db, slugify(payload.title, payload.locality))
    data = payload.model_dump(exclude={"amenities", "images"})
    prop = models.Property(**data, slug=slug, created_by=current_user.id)

    prop.amenities = [models.PropertyAmenity(amenity_name=a) for a in payload.amenities]
    prop.images = [
        models.PropertyImage(
            image_url=img.image_url, public_id=img.public_id,
            display_order=img.display_order, is_primary=img.is_primary,
        )
        for img in payload.images
    ]

    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.put("/{property_id}", response_model=schemas.PropertyDetailOut)
def update_property(
    property_id: int,
    payload: schemas.PropertyUpdate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(404, "Property not found")

    update_data = payload.model_dump(exclude_unset=True, exclude={"amenities"})
    for field, value in update_data.items():
        setattr(prop, field, value)

    if payload.title is not None or payload.locality is not None:
        base = slugify(prop.title, prop.locality)
        prop.slug = unique_slug(db, base, exclude_id=prop.id)

    if payload.amenities is not None:
        prop.amenities = [models.PropertyAmenity(amenity_name=a) for a in payload.amenities]

    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}", status_code=204)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(404, "Property not found")
    db.delete(prop)  # cascades to images/amenities per FK ON DELETE CASCADE
    db.commit()


@router.patch("/{property_id}/status")
def change_status(
    property_id: int, status_value: str,
    db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(404, "Property not found")
    prop.status = status_value
    db.commit()
    return {"id": prop.id, "status": prop.status}


@router.patch("/{property_id}/publish")
def toggle_publish(
    property_id: int, published: bool,
    db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(404, "Property not found")
    prop.published = published
    db.commit()
    return {"id": prop.id, "published": prop.published}


@router.patch("/{property_id}/featured")
def toggle_featured(
    property_id: int, featured: bool,
    db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(404, "Property not found")
    prop.featured = featured
    db.commit()
    return {"id": prop.id, "featured": prop.featured}


# ---- Image sub-resource: lets the admin manage images on a property
# that already exists (upload creation flow adds images inline; this is
# for adding/removing/reordering after the fact, e.g. on the edit page).

@router.post("/{property_id}/images", response_model=schemas.PropertyImageOut, status_code=201)
def add_image(
    property_id: int, payload: schemas.PropertyImageIn,
    db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    prop = db.query(models.Property).options(joinedload(models.Property.images)).filter(
        models.Property.id == property_id
    ).first()
    if not prop:
        raise HTTPException(404, "Property not found")

    # First image on a property is primary by default, regardless of what
    # the client sent, so a property is never left with zero primary images.
    is_primary = payload.is_primary or len(prop.images) == 0
    if is_primary:
        for img in prop.images:
            img.is_primary = False

    image = models.PropertyImage(
        property_id=property_id, image_url=payload.image_url, public_id=payload.public_id,
        display_order=payload.display_order if payload.display_order else len(prop.images),
        is_primary=is_primary,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.delete("/{property_id}/images/{image_id}", status_code=204)
def delete_image(
    property_id: int, image_id: int,
    db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    image = db.query(models.PropertyImage).filter(
        models.PropertyImage.id == image_id, models.PropertyImage.property_id == property_id
    ).first()
    if not image:
        raise HTTPException(404, "Image not found")

    was_primary = image.is_primary
    public_id = image.public_id
    db.delete(image)
    db.flush()

    # Keep exactly one primary image if any remain.
    if was_primary:
        next_image = db.query(models.PropertyImage).filter(
            models.PropertyImage.property_id == property_id
        ).order_by(models.PropertyImage.display_order).first()
        if next_image:
            next_image.is_primary = True

    db.commit()

    # Best-effort cleanup on Cloudinary — never block the DB delete on this.
    if public_id and config.CLOUDINARY_CLOUD_NAME and config.CLOUDINARY_API_KEY and config.CLOUDINARY_API_SECRET:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=config.CLOUDINARY_CLOUD_NAME,
                api_key=config.CLOUDINARY_API_KEY,
                api_secret=config.CLOUDINARY_API_SECRET,
            )
            cloudinary.uploader.destroy(public_id)
        except Exception:  # noqa: BLE001 — cleanup is best-effort, never fail the request over it
            pass


@router.patch("/{property_id}/images/{image_id}", response_model=schemas.PropertyImageOut)
def update_image(
    property_id: int, image_id: int, is_primary: bool | None = None, display_order: int | None = None,
    db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    image = db.query(models.PropertyImage).filter(
        models.PropertyImage.id == image_id, models.PropertyImage.property_id == property_id
    ).first()
    if not image:
        raise HTTPException(404, "Image not found")

    if is_primary:
        db.query(models.PropertyImage).filter(
            models.PropertyImage.property_id == property_id
        ).update({"is_primary": False})
        image.is_primary = True
    if display_order is not None:
        image.display_order = display_order

    db.commit()
    db.refresh(image)
    return image
