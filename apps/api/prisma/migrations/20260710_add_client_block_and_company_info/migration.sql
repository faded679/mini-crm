-- Добавить блокировку клиента
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "is_blocked" BOOLEAN NOT NULL DEFAULT false;

-- Таблица для новостей и важной информации компании
CREATE TABLE IF NOT EXISTS "company_info" (
  "id" SERIAL NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_info_pkey" PRIMARY KEY ("id")
);
