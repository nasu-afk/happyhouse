"""
CSV export/import for property data.

Export: lets the owner download their own listings in a generic CSV shape
to manually feed into whatever bulk-upload tool their 99acres/MagicBricks/
Housing.com broker account provides. Each portal has its own proprietary
upload schema tied to a paid business account — we can't know or guarantee
that format, so this is a generic, documented starting point to adapt from.

Import: lets the owner bring in properties they already have data for
(e.g. typed up from their own existing listings elsewhere) via CSV,
instead of typing each one into the form individually. This is NOT a
scraper — it only accepts data the owner supplies themselves.
"""
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from .. import auth, models
from ..database import get_db
from .admin_properties import slugify, unique_slug

router = APIRouter(prefix="/api/admin/properties", tags=["admin-properties-csv"])

CSV_COLUMNS = [
    "title", "description", "property_type", "listing_type", "status",
    "price", "price_display", "area_sqft", "carpet_area_sqft", "bedrooms",
    "bathrooms", "balconies", "floor", "total_floors", "furnishing_status",
    "parking", "address", "locality", "city", "district", "pincode",
    "possession_status", "amenities", "published", "featured",
]


@router.get("/export.csv")
def export_csv(db: Session = Depends(get_db), _user: models.User = Depends(auth.get_current_user)):
    """
    Generic CSV export of all properties. Amenities are semicolon-joined
    in a single column. Adapt column names/order to match whatever your
    portal's bulk-upload template expects — they all differ.
    """
    properties = db.query(models.Property).options(joinedload(models.Property.amenities)).all()

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=CSV_COLUMNS)
    writer.writeheader()
    for p in properties:
        writer.writerow({
            "title": p.title, "description": p.description or "",
            "property_type": p.property_type, "listing_type": p.listing_type,
            "status": p.status, "price": p.price, "price_display": p.price_display or "",
            "area_sqft": p.area_sqft or "", "carpet_area_sqft": p.carpet_area_sqft or "",
            "bedrooms": p.bedrooms or "", "bathrooms": p.bathrooms or "",
            "balconies": p.balconies or "", "floor": p.floor or "",
            "total_floors": p.total_floors or "", "furnishing_status": p.furnishing_status or "",
            "parking": p.parking or "", "address": p.address or "", "locality": p.locality,
            "city": p.city, "district": p.district, "pincode": p.pincode or "",
            "possession_status": p.possession_status or "",
            "amenities": ";".join(a.amenity_name for a in p.amenities),
            "published": p.published, "featured": p.featured,
        })

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=happyhouse-properties.csv"},
    )


@router.post("/import.csv")
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
    _csrf: None = Depends(auth.verify_csrf),
):
    """
    Bulk-import properties from a CSV the owner fills in themselves
    (same column shape as export.csv). Rows are created as unpublished
    drafts so the owner can review, add images, and publish each one
    individually — nothing goes live automatically.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "File must be a .csv")

    raw = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))

    missing = set(["title", "listing_type", "property_type", "price", "locality"]) - set(reader.fieldnames or [])
    if missing:
        raise HTTPException(400, f"CSV is missing required columns: {', '.join(missing)}")

    created, errors = [], []
    for i, row in enumerate(reader, start=2):  # row 1 is the header
        try:
            slug = unique_slug(db, slugify(row["title"], row["locality"]))
            amenities = [a.strip() for a in row.get("amenities", "").split(";") if a.strip()]

            prop = models.Property(
                title=row["title"], slug=slug,
                description=row.get("description") or None,
                property_type=row["property_type"], listing_type=row["listing_type"],
                status=row.get("status") or "available",
                price=float(row["price"]),
                price_display=row.get("price_display") or None,
                area_sqft=float(row["area_sqft"]) if row.get("area_sqft") else None,
                carpet_area_sqft=float(row["carpet_area_sqft"]) if row.get("carpet_area_sqft") else None,
                bedrooms=int(row["bedrooms"]) if row.get("bedrooms") else None,
                bathrooms=int(row["bathrooms"]) if row.get("bathrooms") else None,
                balconies=int(row["balconies"]) if row.get("balconies") else None,
                floor=row.get("floor") or None,
                total_floors=int(row["total_floors"]) if row.get("total_floors") else None,
                furnishing_status=row.get("furnishing_status") or None,
                parking=row.get("parking") or None,
                address=row.get("address") or None,
                locality=row["locality"], city=row.get("city") or "Thane",
                district=row.get("district") or "Thane", pincode=row.get("pincode") or None,
                possession_status=row.get("possession_status") or None,
                published=False,  # always land as drafts — owner reviews before publishing
                featured=False,
                created_by=current_user.id,
            )
            prop.amenities = [models.PropertyAmenity(amenity_name=a) for a in amenities]
            db.add(prop)
            db.flush()
            created.append({"row": i, "title": prop.title, "id": prop.id})
        except Exception as exc:  # noqa: BLE001 — collect per-row errors, don't abort the batch
            errors.append({"row": i, "error": str(exc)})

    db.commit()
    return {"created": created, "errors": errors}
