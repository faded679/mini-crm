-- Safe additive migration: link shipment request to a specific organization.
-- Does NOT delete or alter existing rows; counterparty_id is nullable.

ALTER TABLE "shipment_requests"
  ADD COLUMN IF NOT EXISTS "counterparty_id" INTEGER;

CREATE INDEX IF NOT EXISTS "shipment_requests_counterparty_id_idx"
  ON "shipment_requests"("counterparty_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shipment_requests_counterparty_id_fkey'
  ) THEN
    ALTER TABLE "shipment_requests"
      ADD CONSTRAINT "shipment_requests_counterparty_id_fkey"
      FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill: if client has exactly one organization, attach it to old requests
UPDATE "shipment_requests" sr
SET "counterparty_id" = sub.counterparty_id
FROM (
  SELECT cc.client_id, MIN(cc.counterparty_id) AS counterparty_id
  FROM "counterparty_contacts" cc
  GROUP BY cc.client_id
  HAVING COUNT(*) = 1
) sub
WHERE sr.client_id = sub.client_id
  AND sr.counterparty_id IS NULL;
