INSERT INTO "vehicles" (
  "name",
  "plate",
  "color",
  "status",
  "mileage",
  "fuel_type",
  "transmission",
  "capacity",
  "active",
  "updated_at"
)
VALUES
  ('Renault Kwid Prata', 'BKA3F78', 'Prata', 'AVAILABLE', 0, 'Flex', 'Manual', 5, true, CURRENT_TIMESTAMP),
  ('Renault Kwid Branco', 'RBW5D42', 'Branco', 'AVAILABLE', 0, 'Flex', 'Manual', 5, true, CURRENT_TIMESTAMP),
  ('Renault Kwid Branco', 'FXC0I09', 'Branco', 'AVAILABLE', 0, 'Flex', 'Manual', 5, true, CURRENT_TIMESTAMP),
  ('Renault Kwid Prata', 'FVB6H55', 'Prata', 'AVAILABLE', 0, 'Flex', 'Manual', 5, true, CURRENT_TIMESTAMP)
ON CONFLICT ("plate") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color",
  "fuel_type" = EXCLUDED."fuel_type",
  "transmission" = EXCLUDED."transmission",
  "capacity" = EXCLUDED."capacity",
  "active" = true,
  "updated_at" = CURRENT_TIMESTAMP;
