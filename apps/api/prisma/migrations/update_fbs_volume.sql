-- Update volume for FBS requests from request_services quantity
-- This migration fills the volume field for existing FBS requests where volume is NULL
-- by taking the quantity value from the first request_service record (which contains the m³ value)

UPDATE shipment_requests sr
SET volume = (
  SELECT rs.quantity
  FROM request_services rs
  WHERE rs.request_id = sr.id
    AND rs.unit = 'м³'
  ORDER BY rs.id ASC
  LIMIT 1
)
WHERE sr.delivery_type_id = 1  -- FBS delivery type
  AND sr.volume IS NULL
  AND EXISTS (
    SELECT 1
    FROM request_services rs2
    WHERE rs2.request_id = sr.id
      AND rs2.unit = 'м³'
  );
