ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "reservations"
ADD COLUMN "rejection_reason" TEXT,
ADD COLUMN "reviewed_by_id" UUID,
ADD COLUMN "reviewed_at" TIMESTAMP(3);

ALTER TABLE "reservation_odometer_records"
ADD COLUMN "fuel_level" TEXT,
ADD COLUMN "vehicle_condition" TEXT,
ADD COLUMN "damages" TEXT;

ALTER TABLE "reservations"
ADD CONSTRAINT "reservations_reviewed_by_id_fkey"
FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
