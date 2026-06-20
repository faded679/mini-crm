-- CreateTable
CREATE TABLE "logists" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_records" (
    "id" SERIAL NOT NULL,
    "logist_id" INTEGER,
    "car_brand" TEXT NOT NULL,
    "car_number" TEXT NOT NULL,
    "driver_name" TEXT NOT NULL,
    "driver_phone" TEXT NOT NULL,
    "logist_info" TEXT,
    "city" TEXT NOT NULL,
    "delivery_date" TIMESTAMP(3) NOT NULL,
    "delivery_type" TEXT NOT NULL DEFAULT 'fbo',
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrier_records_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "shipment_requests" ADD COLUMN "carrier_record_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "logists_email_key" ON "logists"("email");

-- AddForeignKey
ALTER TABLE "carrier_records" ADD CONSTRAINT "carrier_records_logist_id_fkey" FOREIGN KEY ("logist_id") REFERENCES "logists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_requests" ADD CONSTRAINT "shipment_requests_carrier_record_id_fkey" FOREIGN KEY ("carrier_record_id") REFERENCES "carrier_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
