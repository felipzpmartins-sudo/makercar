-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "EquipmentReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "equipment_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category_id" UUID NOT NULL,
    "image_url" TEXT,
    "hero_image_url" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "notes" TEXT,
    "usage_rules" TEXT,
    "specs" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "equipment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "operator_name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "usage_location" TEXT NOT NULL,
    "notes" TEXT,
    "status" "EquipmentReservationStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "cancellation_reason" TEXT,
    "terms_accepted_at" TIMESTAMP(3) NOT NULL,
    "terms_version" TEXT NOT NULL,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_reservation_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_reservation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_categories_name_key" ON "equipment_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_categories_slug_key" ON "equipment_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "equipments_slug_key" ON "equipments"("slug");

-- CreateIndex
CREATE INDEX "equipments_category_id_active_idx" ON "equipments"("category_id", "active");

-- CreateIndex
CREATE INDEX "equipment_reservations_equipment_id_status_idx" ON "equipment_reservations"("equipment_id", "status");

-- CreateIndex
CREATE INDEX "equipment_reservations_user_id_status_idx" ON "equipment_reservations"("user_id", "status");

-- CreateIndex
CREATE INDEX "equipment_reservations_start_date_end_date_idx" ON "equipment_reservations"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "equipment_reservation_logs_reservation_id_idx" ON "equipment_reservation_logs"("reservation_id");

-- AddForeignKey
ALTER TABLE "equipments" ADD CONSTRAINT "equipments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "equipment_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_reservations" ADD CONSTRAINT "equipment_reservations_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_reservations" ADD CONSTRAINT "equipment_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_reservations" ADD CONSTRAINT "equipment_reservations_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_reservation_logs" ADD CONSTRAINT "equipment_reservation_logs_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "equipment_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_reservation_logs" ADD CONSTRAINT "equipment_reservation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
