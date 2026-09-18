-- =========================================================
-- HAPPYHOUSE — DEMO / SEED DATA
-- =========================================================
-- Everything below is SYNTHETIC. It exists only so the
-- development team can see the UI populated while building.
--
-- >>> REMOVE THIS DATA BEFORE PRODUCTION (spec §42) <<<
--    DELETE FROM properties WHERE title LIKE '[DEMO]%';
--
-- Doesn't hardcode a database name — see schema.sql's header for why.
-- Specify the target database on the command line instead:
--   mysql -h <host> -P <port> -u <user> -p <database_name> < seed.sql
-- =========================================================

-- See schema.sql for why this line matters — without it, ₹ and other
-- multi-byte characters get corrupted on import (mojibake), even though
-- this file and the database are both genuinely UTF-8.
SET NAMES utf8mb4;

-- ---- Areas We Serve (examples only — confirm real list with owner, spec §25)
INSERT INTO areas (name, slug, active, display_order) VALUES
  ('Thane West', 'thane-west', TRUE, 1),
  ('Thane East', 'thane-east', TRUE, 2),
  ('Majiwada', 'majiwada', TRUE, 3),
  ('Manpada', 'manpada', TRUE, 4),
  ('Ghodbunder Road', 'ghodbunder-road', TRUE, 5)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---- One demo property (clearly labeled, never shown as a real listing)
INSERT INTO properties (
  title, slug, description, property_type, listing_type, status,
  price, price_display, area_sqft, bedrooms, bathrooms, floor, total_floors,
  furnishing_status, parking, locality, city, district, location_privacy,
  possession_status, featured, published
) VALUES (
  '[DEMO] 2 BHK Modern Apartment', '[demo]-2-bhk-modern-apartment-majiwada',
  'This is placeholder demo content for development only — not a real listing.',
  'apartment', 'buy', 'available',
  8500000, '₹85 Lakh', 950, 2, 2, '4', 12,
  'semi_furnished', '1 Covered', 'Majiwada', 'Thane', 'Thane', 'locality_only',
  'ready_to_move', TRUE, TRUE
)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- ---- Placeholder images for the demo property.
-- Stand-ins only (public Unsplash URLs) — swap for real photography
-- before this stops being a demo. Guarded with NOT EXISTS so re-running
-- this file doesn't pile up duplicate image rows.
INSERT INTO property_images (property_id, image_url, display_order, is_primary)
SELECT p.id, img.url, img.ord, img.is_primary
FROM properties p
JOIN (
  SELECT 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' AS url, 0 AS ord, TRUE AS is_primary
  UNION ALL
  SELECT 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80', 1, FALSE
  UNION ALL
  SELECT 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', 2, FALSE
) img ON TRUE
WHERE p.slug = '[demo]-2-bhk-modern-apartment-majiwada'
  AND NOT EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id);

-- Note: no admin user is seeded here on purpose — create the first owner
-- account via a one-off script so the password hash never sits in
-- version-controlled seed data. See backend/scripts/create_admin.py.
