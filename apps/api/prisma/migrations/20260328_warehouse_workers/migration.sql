-- CreateTable
CREATE TABLE "warehouse_workers" (
    "id" SERIAL NOT NULL,
    "telegram_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_photos" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "file_id" TEXT NOT NULL,
    "file_url" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT NOT NULL,

    CONSTRAINT "request_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_workers_telegram_id_key" ON "warehouse_workers"("telegram_id");

-- CreateIndex
CREATE INDEX "request_photos_request_id_idx" ON "request_photos"("request_id");

-- AddForeignKey
ALTER TABLE "request_photos" ADD CONSTRAINT "request_photos_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "shipment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
