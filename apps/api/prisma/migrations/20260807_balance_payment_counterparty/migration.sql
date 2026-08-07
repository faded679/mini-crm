-- Additive: store target organization for SBP balance deposits
ALTER TABLE "balance_payments"
  ADD COLUMN IF NOT EXISTS "counterparty_id" INTEGER;

CREATE INDEX IF NOT EXISTS "balance_payments_counterparty_id_idx"
  ON "balance_payments"("counterparty_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'balance_payments_counterparty_id_fkey'
  ) THEN
    ALTER TABLE "balance_payments"
      ADD CONSTRAINT "balance_payments_counterparty_id_fkey"
      FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
