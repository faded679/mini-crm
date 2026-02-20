-- ============================================================
-- Migration: Unified City table
-- Replaces: directions table, shipment_requests.city (text),
--           delivery_schedules.destination (text)
-- ============================================================

-- 1) Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id          SERIAL PRIMARY KEY,
  short_name  TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Seed cities from existing directions
INSERT INTO cities (short_name, full_name, created_at, updated_at)
SELECT name, name, created_at, updated_at
FROM directions
ON CONFLICT (short_name) DO NOTHING;

-- 3) Seed cities from shipment_requests.city (ones not already in cities)
INSERT INTO cities (short_name, full_name)
SELECT DISTINCT city, city
FROM shipment_requests
WHERE city != '' AND city NOT IN (SELECT short_name FROM cities)
ON CONFLICT (short_name) DO NOTHING;

-- 4) Seed cities from delivery_schedules.destination
INSERT INTO cities (short_name, full_name)
SELECT DISTINCT destination, destination
FROM delivery_schedules
WHERE destination != '' AND destination NOT IN (SELECT short_name FROM cities)
ON CONFLICT (short_name) DO NOTHING;

-- 5) Add city_id column to shipment_requests
ALTER TABLE shipment_requests ADD COLUMN IF NOT EXISTS city_id INTEGER;

-- 6) Populate city_id from city text
UPDATE shipment_requests sr
SET city_id = c.id
FROM cities c
WHERE c.short_name = sr.city;

-- 7) For any remaining nulls, create a fallback city
INSERT INTO cities (short_name, full_name)
SELECT 'Не указан', 'Не указан'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE short_name = 'Не указан')
  AND EXISTS (SELECT 1 FROM shipment_requests WHERE city_id IS NULL);

UPDATE shipment_requests
SET city_id = (SELECT id FROM cities WHERE short_name = 'Не указан')
WHERE city_id IS NULL;

-- 8) Make city_id NOT NULL + add FK
ALTER TABLE shipment_requests ALTER COLUMN city_id SET NOT NULL;
ALTER TABLE shipment_requests
  ADD CONSTRAINT fk_shipment_requests_city
  FOREIGN KEY (city_id) REFERENCES cities(id);

-- 9) Add city_id column to price_rates (rename direction_id -> city_id)
ALTER TABLE price_rates ADD COLUMN IF NOT EXISTS city_id INTEGER;

UPDATE price_rates pr
SET city_id = c.id
FROM directions d
JOIN cities c ON c.short_name = d.name
WHERE pr.direction_id = d.id;

ALTER TABLE price_rates ALTER COLUMN city_id SET NOT NULL;
ALTER TABLE price_rates
  ADD CONSTRAINT fk_price_rates_city
  FOREIGN KEY (city_id) REFERENCES cities(id);

-- Drop old FK and column
ALTER TABLE price_rates DROP CONSTRAINT IF EXISTS "price_rates_direction_id_fkey";
ALTER TABLE price_rates DROP COLUMN IF EXISTS direction_id;

-- Recreate index
DROP INDEX IF EXISTS "price_rates_direction_id_unit_idx";
CREATE INDEX IF NOT EXISTS "price_rates_city_id_unit_idx" ON price_rates(city_id, unit);

-- 10) Add city_id column to delivery_schedules
ALTER TABLE delivery_schedules ADD COLUMN IF NOT EXISTS city_id INTEGER;

UPDATE delivery_schedules ds
SET city_id = c.id
FROM cities c
WHERE c.short_name = ds.destination;

-- Fallback for unmatched
UPDATE delivery_schedules
SET city_id = (SELECT id FROM cities WHERE short_name = 'Не указан')
WHERE city_id IS NULL;

-- If still null (no fallback city created), create it
INSERT INTO cities (short_name, full_name)
SELECT 'Не указан', 'Не указан'
WHERE NOT EXISTS (SELECT 1 FROM cities WHERE short_name = 'Не указан')
  AND EXISTS (SELECT 1 FROM delivery_schedules WHERE city_id IS NULL);

UPDATE delivery_schedules
SET city_id = (SELECT id FROM cities WHERE short_name = 'Не указан')
WHERE city_id IS NULL;

ALTER TABLE delivery_schedules ALTER COLUMN city_id SET NOT NULL;
ALTER TABLE delivery_schedules
  ADD CONSTRAINT fk_delivery_schedules_city
  FOREIGN KEY (city_id) REFERENCES cities(id);

-- 11) Drop directions table (after all references removed)
DROP TABLE IF EXISTS directions CASCADE;
