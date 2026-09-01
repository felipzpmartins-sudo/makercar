ALTER TABLE "reservations"
ADD COLUMN IF NOT EXISTS "cancellation_reason" TEXT;
