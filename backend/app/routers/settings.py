from fastapi import APIRouter, Depends, HTTPException
import re
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db

router = APIRouter(tags=["settings"])


@router.get("/api/settings", response_model=schemas.SiteSettingsOut)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SiteSettings).filter(models.SiteSettings.id == 1).first()
    if not settings:
        settings = models.SiteSettings(id=1, business_name="HappyHouse")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/api/admin/settings", response_model=schemas.SiteSettingsOut)
def update_settings(
    payload: schemas.SiteSettingsUpdate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    settings = db.query(models.SiteSettings).filter(models.SiteSettings.id == 1).first()
    if not settings:
        settings = models.SiteSettings(id=1)
        db.add(settings)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings


@router.get("/api/areas")
def list_areas(db: Session = Depends(get_db)):
    return db.query(models.Area).filter(models.Area.active.is_(True)).order_by(
        models.Area.display_order
    ).all()


@router.get("/api/admin/areas")
def list_all_areas(db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Area).order_by(models.Area.display_order).all()


@router.post("/api/admin/areas", status_code=201)
def create_area(
    payload: schemas.AreaCreate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    slug = re.sub(r"[^a-z0-9]+", "-", payload.name.lower()).strip("-")
    base_slug, n = slug, 2
    while db.query(models.Area).filter(models.Area.slug == slug).first():
        slug = f"{base_slug}-{n}"
        n += 1

    area = models.Area(
        name=payload.name, slug=slug, description=payload.description,
        image_url=payload.image_url, active=payload.active,
        display_order=payload.display_order,
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return area


@router.put("/api/admin/areas/{area_id}")
def update_area(
    area_id: int, payload: schemas.AreaUpdate,
    db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not area:
        raise HTTPException(404, "Area not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(area, field, value)

    db.commit()
    db.refresh(area)
    return area


@router.delete("/api/admin/areas/{area_id}", status_code=204)
def delete_area(
    area_id: int, db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    area = db.query(models.Area).filter(models.Area.id == area_id).first()
    if not area:
        raise HTTPException(404, "Area not found")
    db.delete(area)
    db.commit()
