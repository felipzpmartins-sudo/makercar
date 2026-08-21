ALTER TABLE "vehicles"
ADD COLUMN "support_only" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "vehicles"
SET "support_only" = TRUE
WHERE "plate" = 'BWK7761';
