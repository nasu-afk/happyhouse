-- =========================================================
-- HAPPYHOUSE — MySQL Schema
-- Property Consultancy & Property Management Platform
-- =========================================================
-- Run against MySQL 8.0+
-- Character set: utf8mb4 (full unicode support, incl. ₹ and emoji)
--
-- Intentionally does NOT hardcode a database name via CREATE DATABASE/
-- USE — different hosting setups name the database differently (local
-- installs used "happyhouse", Railway's managed MySQL provisions one
-- called "railway" by default). Specify the target database on the
-- command line instead:
--   mysql -h <host> -P <port> -u <user> -p <database_name> < schema.sql
-- =========================================================

-- Force the connection charset explicitly. Without this, some MySQL
-- client invocations (notably the one Docker's entrypoint uses to
-- auto-run files in docker-entrypoint-initdb.d/) fall back to a non-UTF-8
-- default, silently mangling multi-byte characters like ₹ on import even
-- though this file's bytes and the table columns are correctly UTF-8.
SET NAMES utf8mb4;

-- ---------------------------------------------------------
-- users  (admin / consultant accounts — not public signups)
-- ---------------------------------------------------------
CREATE TABLE users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)        NOT NULL,
  email         VARCHAR(190)        NOT NULL,
  password_hash VARCHAR(255)        NOT NULL,
  role          ENUM('owner','admin','agent') NOT NULL DEFAULT 'admin',
  is_active     BOOLEAN             NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- areas  ("Areas We Serve" — dynamic, admin-managed)
-- ---------------------------------------------------------
CREATE TABLE areas (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(120)  NOT NULL,
  slug         VARCHAR(140)  NOT NULL,
  description  TEXT          NULL,
  image_url    VARCHAR(500)  NULL,
  active       BOOLEAN       NOT NULL DEFAULT TRUE,
  display_order INT          NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_areas_slug (slug)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- properties  (core listing entity)
-- ---------------------------------------------------------
CREATE TABLE properties (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title               VARCHAR(200)   NOT NULL,
  slug                VARCHAR(220)   NOT NULL,
  description          TEXT          NULL,

  property_type       ENUM('apartment','flat','house','villa','plot',
                            'shop','office','commercial','other')
                                       NOT NULL,
  listing_type        ENUM('buy','rent') NOT NULL,
  status               ENUM('available','sold','rented','on_hold')
                                       NOT NULL DEFAULT 'available',

  price                DECIMAL(14,2)  NOT NULL,
  price_display        VARCHAR(60)    NULL,  -- e.g. "₹85 Lakh" (owner-controlled override)

  area_sqft            DECIMAL(10,2)  NULL,
  carpet_area_sqft      DECIMAL(10,2)  NULL,
  bedrooms              SMALLINT       NULL,
  bathrooms             SMALLINT       NULL,
  balconies             SMALLINT       NULL,
  floor                 VARCHAR(20)    NULL,   -- e.g. "4" or "Ground"
  total_floors          SMALLINT       NULL,
  furnishing_status     ENUM('unfurnished','semi_furnished','fully_furnished') NULL,
  parking               VARCHAR(60)    NULL,   -- e.g. "1 Covered", "2 Open"

  address               VARCHAR(255)   NULL,
  locality              VARCHAR(120)   NOT NULL,
  city                  VARCHAR(100)   NOT NULL DEFAULT 'Thane',
  district              VARCHAR(100)   NOT NULL DEFAULT 'Thane',
  pincode               VARCHAR(10)    NULL,
  latitude              DECIMAL(10,7)  NULL,
  longitude             DECIMAL(10,7)  NULL,
  location_privacy      ENUM('exact','approximate','locality_only')
                                        NOT NULL DEFAULT 'locality_only',

  possession_status     ENUM('ready_to_move','under_construction','new_launch') NULL,

  featured              BOOLEAN        NOT NULL DEFAULT FALSE,
  published             BOOLEAN        NOT NULL DEFAULT FALSE,

  created_by            BIGINT UNSIGNED NULL,

  created_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_properties_slug (slug),
  KEY idx_properties_published (published),
  KEY idx_properties_featured (featured),
  KEY idx_properties_listing_type (listing_type),
  KEY idx_properties_property_type (property_type),
  KEY idx_properties_locality (locality),
  KEY idx_properties_price (price),
  KEY idx_properties_status (status),
  KEY idx_properties_search (published, listing_type, property_type, locality, price),

  CONSTRAINT fk_properties_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Full-text search across title/description/locality
ALTER TABLE properties ADD FULLTEXT INDEX ftx_properties_search (title, description, locality);

-- ---------------------------------------------------------
-- property_images
-- ---------------------------------------------------------
CREATE TABLE property_images (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id   BIGINT UNSIGNED NOT NULL,
  image_url     VARCHAR(500)    NOT NULL,
  public_id     VARCHAR(255)    NULL,   -- Cloudinary public_id, for deletion/management
  display_order SMALLINT        NOT NULL DEFAULT 0,
  is_primary    BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_property_images_property (property_id),
  CONSTRAINT fk_images_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- property_amenities
-- ---------------------------------------------------------
CREATE TABLE property_amenities (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id   BIGINT UNSIGNED NOT NULL,
  amenity_name  VARCHAR(100)    NOT NULL,

  KEY idx_amenities_property (property_id),
  UNIQUE KEY uq_property_amenity (property_id, amenity_name),
  CONSTRAINT fk_amenities_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- enquiries
-- ---------------------------------------------------------
CREATE TABLE enquiries (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id   BIGINT UNSIGNED NULL,   -- nullable: general enquiries (e.g. from /contact)
  name          VARCHAR(120)    NOT NULL,
  phone         VARCHAR(20)     NOT NULL,
  email         VARCHAR(190)    NULL,
  message       TEXT            NULL,
  enquiry_type  ENUM('property','general','site_visit') NOT NULL DEFAULT 'property',
  status        ENUM('new','contacted','follow_up','closed') NOT NULL DEFAULT 'new',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_enquiries_property (property_id),
  KEY idx_enquiries_status (status),
  KEY idx_enquiries_created (created_at),
  CONSTRAINT fk_enquiries_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- site_settings  (single-row config table)
-- ---------------------------------------------------------
CREATE TABLE site_settings (
  id             TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  business_name  VARCHAR(150)  NOT NULL DEFAULT 'HappyHouse',
  tagline        VARCHAR(200)  NULL,
  consultant_name VARCHAR(120) NULL,
  phone          VARCHAR(20)   NULL,
  whatsapp       VARCHAR(20)   NULL,
  email          VARCHAR(190)  NULL,
  address        VARCHAR(255)  NULL,
  about_text     TEXT          NULL,
  logo_url       VARCHAR(500)  NULL,
  social_links   JSON          NULL,   -- {"instagram": "...", "facebook": "...", ...}
  business_hours JSON          NULL,   -- {"mon_fri": "10:00-19:00", "sat": "...", "sun": "Closed"}
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_single_row CHECK (id = 1)
) ENGINE=InnoDB;

INSERT INTO site_settings (id, business_name, tagline)
VALUES (1, 'HappyHouse', 'Your Local Property Partner in Thane')
ON DUPLICATE KEY UPDATE id = id;

-- =========================================================
-- Notes:
-- * All monetary values stored as DECIMAL, never FLOAT (avoids rounding errors).
-- * `price_display` lets the owner show "₹85 Lakh" instead of a raw number
--   without changing how `price` is used for filtering/sorting.
-- * `location_privacy` on properties enforces section 34 of the spec —
--   exact coordinates are only exposed to the public API when set to 'exact'.
-- * Demo/seed data must live in a separate seed.sql, clearly labeled,
--   and removed before production (see spec section 42).
-- =========================================================
