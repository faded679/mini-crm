-- Создаем промежуточную таблицу для связи счетов и заявок (многие-ко-многим)
CREATE TABLE IF NOT EXISTS "invoice_requests" (
  "id" SERIAL PRIMARY KEY,
  "invoice_id" INTEGER NOT NULL,
  "request_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_requests_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "invoice_requests_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "shipment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "invoice_requests_invoice_id_request_id_key" UNIQUE ("invoice_id", "request_id")
);

-- Переносим существующие связи из invoices.request_id в invoice_requests
INSERT INTO "invoice_requests" ("invoice_id", "request_id", "created_at")
SELECT "id", "request_id", "created_at"
FROM "invoices"
WHERE "request_id" IS NOT NULL;

-- Удаляем старую колонку request_id из invoices
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "request_id";

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS "invoice_requests_invoice_id_idx" ON "invoice_requests"("invoice_id");
CREATE INDEX IF NOT EXISTS "invoice_requests_request_id_idx" ON "invoice_requests"("request_id");
