-- CreateEnum
CREATE TYPE "ReservationOdometerType" AS ENUM ('PICKUP', 'RETURN');

-- CreateTable
CREATE TABLE "reservation_odometer_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservation_id" UUID NOT NULL,
    "type" "ReservationOdometerType" NOT NULL,
    "vehicle_id" UUID,
    "mileage" INTEGER NOT NULL,
    "photo_url" TEXT NOT NULL,
    "photo_public_id" TEXT,
    "notes" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "took_reserved_vehicle" BOOLEAN,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_odometer_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservation_odometer_records_reservation_id_type_key" ON "reservation_odometer_records"("reservation_id", "type");

-- CreateIndex
CREATE INDEX "reservation_odometer_records_vehicle_id_type_idx" ON "reservation_odometer_records"("vehicle_id", "type");

-- AddForeignKey
ALTER TABLE "reservation_odometer_records" ADD CONSTRAINT "reservation_odometer_records_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_odometer_records" ADD CONSTRAINT "reservation_odometer_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_odometer_records" ADD CONSTRAINT "reservation_odometer_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
