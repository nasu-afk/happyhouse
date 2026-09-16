from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db
from ..limiter import limiter

router = APIRouter(tags=["enquiries"])


@router.post("/api/enquiries", response_model=schemas.EnquiryOut, status_code=201)
@limiter.limit("10/hour")
def submit_enquiry(request: Request, payload: schemas.EnquiryCreate, db: Session = Depends(get_db)):
    if payload.property_id is not None:
        exists = db.query(models.Property.id).filter(
            models.Property.id == payload.property_id,
            models.Property.published.is_(True),
        ).first()
        if not exists:
            raise HTTPException(400, "Referenced property does not exist or is not published")

    enquiry = models.Enquiry(**payload.model_dump())
    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)
    return enquiry


@router.get("/api/admin/enquiries", response_model=list[schemas.EnquiryOut])
def list_enquiries(
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user),
    status_filter: str | None = None,
):
    query = db.query(models.Enquiry).order_by(models.Enquiry.created_at.desc())
    if status_filter:
        query = query.filter(models.Enquiry.status == status_filter)
    return query.all()


@router.patch("/api/admin/enquiries/{enquiry_id}", response_model=schemas.EnquiryOut)
def update_enquiry_status(
    enquiry_id: int,
    payload: schemas.EnquiryStatusUpdate,
    db: Session = Depends(get_db),
    _user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    enquiry = db.query(models.Enquiry).filter(models.Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(404, "Enquiry not found")
    enquiry.status = payload.status
    db.commit()
    db.refresh(enquiry)
    return enquiry
