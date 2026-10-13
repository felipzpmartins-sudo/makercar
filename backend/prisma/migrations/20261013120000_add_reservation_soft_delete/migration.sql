-- Mantém as reservas excluídas na lixeira para que apenas o Imperador Supremo
-- possa revisá-las e restaurá-las.
ALTER TABLE "reservations"
  ADD COLUMN "deleted_at" TIMESTAMP(3),
  ADD COLUMN "deleted_by_id" UUID;

CREATE INDEX "reservations_deleted_at_idx" ON "reservations"("deleted_at");

ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_deleted_by_id_fkey"
  FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
