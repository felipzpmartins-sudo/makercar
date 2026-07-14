CREATE TYPE "CnhStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "users"
ADD COLUMN "cnh_number" TEXT,
ADD COLUMN "cnh_expires_at" TIMESTAMP(3),
ADD COLUMN "cnh_photo_url" TEXT,
ADD COLUMN "cnh_photo_public_id" TEXT,
ADD COLUMN "cnh_status" "CnhStatus",
ADD COLUMN "cnh_reviewed_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_cnh_number_key" ON "users"("cnh_number");
