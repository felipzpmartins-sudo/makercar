ALTER TABLE "reservations"
ADD COLUMN "cancellation_requested_at" TIMESTAMP(3),
ADD COLUMN "cancellation_request_reason" TEXT;

CREATE INDEX "reservations_cancellation_requested_at_idx"
ON "reservations"("cancellation_requested_at");
