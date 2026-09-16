"""
Pydantic schemas — request/response contracts for the API.
Kept separate from SQLAlchemy models (models.py) so DB shape and
wire shape can evolve independently.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


# ---------- Shared enums as literals kept loose here; FastAPI will
# ---------- validate against the DB enum on write via SQLAlchemy.

class PropertyImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    image_url: str
    display_order: int
    is_primary: bool


class PropertyImageIn(BaseModel):
    image_url: str
    public_id: Optional[str] = None
    display_order: int = 0
    is_primary: bool = False


class PropertyCardOut(BaseModel):
    """Slim shape used for listing/search results and property cards."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    listing_type: str
    property_type: str
    status: str
    price: Decimal
    price_display: Optional[str] = None
    locality: str
    city: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[Decimal] = None
    featured: bool
    primary_image: Optional[str] = None


class PropertyDetailOut(BaseModel):
    """Full shape used on the property detail page."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    description: Optional[str] = None
    property_type: str
    listing_type: str
    status: str
    price: Decimal
    price_display: Optional[str] = None
    area_sqft: Optional[Decimal] = None
    carpet_area_sqft: Optional[Decimal] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    balconies: Optional[int] = None
    floor: Optional[str] = None
    total_floors: Optional[int] = None
    furnishing_status: Optional[str] = None
    parking: Optional[str] = None
    address: Optional[str] = None
    locality: str
    city: str
    district: str
    pincode: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    location_privacy: str
    possession_status: Optional[str] = None
    featured: bool
    published: bool
    created_at: datetime
    updated_at: datetime
    images: List[PropertyImageOut] = []
    amenities: List[str] = []

    @field_validator("amenities", mode="before")
    @classmethod
    def _normalize_amenities(cls, v):
        """
        Accepts either plain strings (the public /api/properties/{slug}
        endpoint builds this list manually) or PropertyAmenity ORM
        objects (the admin create/update endpoints return the SQLAlchemy
        `prop` object directly, whose `.amenities` relationship yields
        model instances, not strings) — without this, admin create/update
        responses crash with a 500 any time amenities are set, on any
        database backend, not just in tests.
        """
        if v is None:
            return []
        return [item.amenity_name if hasattr(item, "amenity_name") else item for item in v]


class PropertyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = None
    property_type: str
    listing_type: str
    status: str = "available"
    price: Decimal = Field(gt=0)
    price_display: Optional[str] = None
    area_sqft: Optional[Decimal] = None
    carpet_area_sqft: Optional[Decimal] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    balconies: Optional[int] = None
    floor: Optional[str] = None
    total_floors: Optional[int] = None
    furnishing_status: Optional[str] = None
    parking: Optional[str] = None
    address: Optional[str] = None
    locality: str = Field(min_length=2, max_length=120)
    city: str = "Thane"
    district: str = "Thane"
    pincode: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    location_privacy: str = "locality_only"
    possession_status: Optional[str] = None
    featured: bool = False
    published: bool = False
    amenities: List[str] = []
    images: List[PropertyImageIn] = []


class PropertyUpdate(BaseModel):
    """All fields optional — PATCH-style partial update."""
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    status: Optional[str] = None
    price: Optional[Decimal] = None
    price_display: Optional[str] = None
    area_sqft: Optional[Decimal] = None
    carpet_area_sqft: Optional[Decimal] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    balconies: Optional[int] = None
    floor: Optional[str] = None
    total_floors: Optional[int] = None
    furnishing_status: Optional[str] = None
    parking: Optional[str] = None
    address: Optional[str] = None
    locality: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    location_privacy: Optional[str] = None
    possession_status: Optional[str] = None
    featured: Optional[bool] = None
    published: Optional[bool] = None
    amenities: Optional[List[str]] = None


class EnquiryCreate(BaseModel):
    property_id: Optional[int] = None
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=20)
    email: Optional[EmailStr] = None
    message: Optional[str] = None
    enquiry_type: str = "property"


class EnquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: Optional[int]
    name: str
    phone: str
    email: Optional[str]
    message: Optional[str]
    enquiry_type: str
    status: str
    created_at: datetime


class EnquiryStatusUpdate(BaseModel):
    status: str  # new | contacted | follow_up | closed


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class SiteSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    business_name: str
    tagline: Optional[str]
    consultant_name: Optional[str]
    phone: Optional[str]
    whatsapp: Optional[str]
    email: Optional[str]
    address: Optional[str]
    about_text: Optional[str]
    logo_url: Optional[str]
    social_links: Optional[dict]
    business_hours: Optional[dict]


class SiteSettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    tagline: Optional[str] = None
    consultant_name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    about_text: Optional[str] = None
    logo_url: Optional[str] = None
    social_links: Optional[dict] = None
    business_hours: Optional[dict] = None


class AreaCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: Optional[str] = None
    image_url: Optional[str] = None
    active: bool = True
    display_order: int = 0


class AreaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    active: Optional[bool] = None
    display_order: Optional[int] = None


class PaginatedProperties(BaseModel):
    items: List[PropertyCardOut]
    total: int
    page: int
    page_size: int
    total_pages: int
