"""
SQLAlchemy models for HappyHouse.
Mirrors database/schema.sql — keep both in sync.
"""
from datetime import datetime
from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, Column, DateTime, Enum,
    ForeignKey, Integer, JSON, Numeric, SmallInteger, String, Text,
    UniqueConstraint, Index, func
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(190), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("owner", "admin", "agent", name="user_role"), nullable=False, default="admin")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    properties = relationship("Property", back_populates="creator")


class Area(Base):
    __tablename__ = "areas"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    slug = Column(String(140), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    active = Column(Boolean, nullable=False, default=True)
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Property(Base):
    __tablename__ = "properties"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(220), nullable=False, unique=True)
    description = Column(Text, nullable=True)

    property_type = Column(
        Enum("apartment", "flat", "house", "villa", "plot", "shop",
             "office", "commercial", "other", name="property_type"),
        nullable=False,
    )
    listing_type = Column(Enum("buy", "rent", name="listing_type"), nullable=False)
    status = Column(
        Enum("available", "sold", "rented", "on_hold", name="property_status"),
        nullable=False, default="available",
    )

    price = Column(Numeric(14, 2), nullable=False)
    price_display = Column(String(60), nullable=True)

    area_sqft = Column(Numeric(10, 2), nullable=True)
    carpet_area_sqft = Column(Numeric(10, 2), nullable=True)
    bedrooms = Column(SmallInteger, nullable=True)
    bathrooms = Column(SmallInteger, nullable=True)
    balconies = Column(SmallInteger, nullable=True)
    floor = Column(String(20), nullable=True)
    total_floors = Column(SmallInteger, nullable=True)
    furnishing_status = Column(
        Enum("unfurnished", "semi_furnished", "fully_furnished", name="furnishing_status"),
        nullable=True,
    )
    parking = Column(String(60), nullable=True)

    address = Column(String(255), nullable=True)
    locality = Column(String(120), nullable=False)
    city = Column(String(100), nullable=False, default="Thane")
    district = Column(String(100), nullable=False, default="Thane")
    pincode = Column(String(10), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    location_privacy = Column(
        Enum("exact", "approximate", "locality_only", name="location_privacy"),
        nullable=False, default="locality_only",
    )

    possession_status = Column(
        Enum("ready_to_move", "under_construction", "new_launch", name="possession_status"),
        nullable=True,
    )

    featured = Column(Boolean, nullable=False, default=False)
    published = Column(Boolean, nullable=False, default=False)

    created_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    creator = relationship("User", back_populates="properties")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan",
                           order_by="PropertyImage.display_order")
    amenities = relationship("PropertyAmenity", back_populates="property", cascade="all, delete-orphan")
    enquiries = relationship("Enquiry", back_populates="property")

    __table_args__ = (
        Index("idx_properties_search", "published", "listing_type", "property_type", "locality", "price"),
    )


class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    property_id = Column(BigInteger, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    public_id = Column(String(255), nullable=True)
    display_order = Column(SmallInteger, nullable=False, default=0)
    is_primary = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now())

    property = relationship("Property", back_populates="images")


class PropertyAmenity(Base):
    __tablename__ = "property_amenities"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    property_id = Column(BigInteger, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    amenity_name = Column(String(100), nullable=False)

    property = relationship("Property", back_populates="amenities")

    __table_args__ = (UniqueConstraint("property_id", "amenity_name", name="uq_property_amenity"),)


class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    property_id = Column(BigInteger, ForeignKey("properties.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(120), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(190), nullable=True)
    message = Column(Text, nullable=True)
    enquiry_type = Column(
        Enum("property", "general", "site_visit", name="enquiry_type"),
        nullable=False, default="property",
    )
    status = Column(
        Enum("new", "contacted", "follow_up", "closed", name="enquiry_status"),
        nullable=False, default="new",
    )
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    property = relationship("Property", back_populates="enquiries")


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id = Column(SmallInteger, primary_key=True, default=1)
    business_name = Column(String(150), nullable=False, default="HappyHouse")
    tagline = Column(String(200), nullable=True)
    consultant_name = Column(String(120), nullable=True)
    phone = Column(String(20), nullable=True)
    whatsapp = Column(String(20), nullable=True)
    email = Column(String(190), nullable=True)
    address = Column(String(255), nullable=True)
    about_text = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    social_links = Column(JSON, nullable=True)
    business_hours = Column(JSON, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (CheckConstraint("id = 1", name="chk_single_row"),)
