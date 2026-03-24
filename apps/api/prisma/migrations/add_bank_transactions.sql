-- Create TransactionStatus enum
CREATE TYPE "TransactionStatus" AS ENUM ('new', 'matched', 'unmatched', 'ignored');

-- Create bank_import_batches table
CREATE TABLE "bank_import_batches" (
  "id" TEXT NOT NULL,
  "file_name" TEXT NOT NULL,
  "period_start" TIMESTAMP(3) NOT NULL,
  "period_end" TIMESTAMP(3) NOT NULL,
  "account" TEXT NOT NULL,
  "total_incoming" DOUBLE PRECISION NOT NULL,
  "total_outgoing" DOUBLE PRECISION NOT NULL,
  "open_balance" DOUBLE PRECISION NOT NULL,
  "close_balance" DOUBLE PRECISION NOT NULL,
  "record_count" INTEGER NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'manual',
  "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bank_import_batches_pkey" PRIMARY KEY ("id")
);

-- Create bank_transactions table
CREATE TABLE "bank_transactions" (
  "id" SERIAL NOT NULL,
  "document_number" TEXT NOT NULL,
  "document_date" TIMESTAMP(3) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "direction" TEXT NOT NULL,

  "payer_name" TEXT NOT NULL,
  "payer_inn" TEXT,
  "payer_account" TEXT,
  "payer_bik" TEXT,
  "payer_bank" TEXT,

  "recipient_name" TEXT NOT NULL,
  "recipient_inn" TEXT,
  "recipient_account" TEXT,

  "purpose" TEXT NOT NULL,

  "counterparty_id" INTEGER,
  "invoice_numbers" TEXT[] DEFAULT ARRAY[]::TEXT[],

  "status" "TransactionStatus" NOT NULL DEFAULT 'new',
  "matched_at" TIMESTAMP(3),

  "import_batch_id" TEXT NOT NULL,
  "raw_data" JSONB,

  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bank_transactions_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "bank_transactions_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "bank_import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX "bank_transactions_document_number_document_date_amount_payer_inn_key"
  ON "bank_transactions"("document_number", "document_date", "amount", "payer_inn");

-- Create counterparty_balances table
CREATE TABLE "counterparty_balances" (
  "id" SERIAL NOT NULL,
  "counterparty_id" INTEGER NOT NULL,
  "total_billed" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "counterparty_balances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "counterparty_balances_counterparty_id_fkey" FOREIGN KEY ("counterparty_id") REFERENCES "counterparties"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "counterparty_balances_counterparty_id_key" ON "counterparty_balances"("counterparty_id");
