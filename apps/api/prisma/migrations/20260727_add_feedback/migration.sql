-- CreateTable
CREATE TABLE "feedback" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER,
    "client_name" TEXT NOT NULL DEFAULT '',
    "client_email" TEXT NOT NULL DEFAULT '',
    "client_phone" TEXT NOT NULL DEFAULT '',
    "organization" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);
