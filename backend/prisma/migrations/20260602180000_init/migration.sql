CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'RESERVED', 'MAINTENANCE');
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'FINISHED', 'CANCELLED');

CREATE TABLE "departments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "department_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "plate" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
  "mileage" INTEGER NOT NULL,
  "fuel_type" TEXT NOT NULL,
  "transmission" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL,
  "image_url" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reservations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vehicle_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "pickup_date" TIMESTAMP(3) NOT NULL,
  "return_date" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reservation_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reservation_id" UUID NOT NULL,
  "action" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reservation_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vehicle_checklists" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reservation_id" UUID NOT NULL,
  "fuel_level" INTEGER NOT NULL,
  "tires_ok" BOOLEAN NOT NULL,
  "oil_ok" BOOLEAN NOT NULL,
  "lights_ok" BOOLEAN NOT NULL,
  "documents_ok" BOOLEAN NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "vehicle_checklists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");
CREATE INDEX "reservations_vehicle_id_status_idx" ON "reservations"("vehicle_id", "status");
CREATE INDEX "reservations_user_id_status_idx" ON "reservations"("user_id", "status");
CREATE UNIQUE INDEX "vehicle_checklists_reservation_id_key" ON "vehicle_checklists"("reservation_id");
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reservation_logs" ADD CONSTRAINT "reservation_logs_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reservation_logs" ADD CONSTRAINT "reservation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vehicle_checklists" ADD CONSTRAINT "vehicle_checklists_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
