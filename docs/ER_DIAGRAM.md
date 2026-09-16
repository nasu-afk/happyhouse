# HappyHouse — Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ PROPERTIES : creates
    PROPERTIES ||--o{ PROPERTY_IMAGES : has
    PROPERTIES ||--o{ PROPERTY_AMENITIES : has
    PROPERTIES ||--o{ ENQUIRIES : receives

    USERS {
        bigint id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    PROPERTIES {
        bigint id PK
        varchar title
        varchar slug UK
        text description
        enum property_type
        enum listing_type
        enum status
        decimal price
        varchar price_display
        decimal area_sqft
        decimal carpet_area_sqft
        smallint bedrooms
        smallint bathrooms
        smallint balconies
        varchar floor
        smallint total_floors
        enum furnishing_status
        varchar parking
        varchar address
        varchar locality
        varchar city
        varchar district
        varchar pincode
        decimal latitude
        decimal longitude
        enum location_privacy
        enum possession_status
        boolean featured
        boolean published
        bigint created_by FK
        timestamp created_at
        timestamp updated_at
    }

    PROPERTY_IMAGES {
        bigint id PK
        bigint property_id FK
        varchar image_url
        varchar public_id
        smallint display_order
        boolean is_primary
        timestamp created_at
    }

    PROPERTY_AMENITIES {
        bigint id PK
        bigint property_id FK
        varchar amenity_name
    }

    ENQUIRIES {
        bigint id PK
        bigint property_id FK "nullable"
        varchar name
        varchar phone
        varchar email
        text message
        enum enquiry_type
        enum status
        timestamp created_at
        timestamp updated_at
    }

    AREAS {
        bigint id PK
        varchar name
        varchar slug UK
        text description
        varchar image_url
        boolean active
        int display_order
    }

    SITE_SETTINGS {
        tinyint id PK "always 1"
        varchar business_name
        varchar tagline
        varchar consultant_name
        varchar phone
        varchar whatsapp
        varchar email
        varchar address
        text about_text
        varchar logo_url
        json social_links
        json business_hours
    }
```

## Design notes

- **`areas` and `site_settings` are intentionally disconnected** from `properties` by foreign key. `areas` is a curated list for the "Areas We Serve" UI (spec §25); property `locality` is free text so listings aren't blocked on an area existing first. If strict linkage is wanted later, add `area_id` to `properties` as a nullable FK.
- **`site_settings` is a single-row table** (`id` pinned to `1` via CHECK constraint) — there is exactly one business configuration, matching spec §33 ("public site automatically reflects changes").
- **`property_images.public_id`** stores the Cloudinary (or equivalent) asset identifier separately from the served URL, so images can be deleted from storage — not just unlinked in the DB — when removed.
- **`enquiries.property_id` is nullable** to support general enquiries from `/contact` that aren't tied to a specific listing (spec §28 vs §29).
- **Indexes**: `idx_properties_search` is a composite covering the most common filter combination (published + listing_type + property_type + locality + price) for the search/filter/sort flow in spec §22–24. A FULLTEXT index covers free-text search across title/description/locality.
- **No images stored in MySQL** — `image_url`/`public_id` only, per spec §52 ("Do NOT store images inside MySQL").
