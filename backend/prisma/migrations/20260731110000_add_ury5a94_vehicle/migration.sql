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
VALUES (
  'Renault Kwid Zen 2 Preto',
  'URY5A94',
  'Preto',
  'AVAILABLE',
  0,
  'Flex',
  'Manual',
  5,
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("plate") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color",
  "fuel_type" = EXCLUDED."fuel_type",
  "transmission" = EXCLUDED."transmission",
  "capacity" = EXCLUDED."capacity",
  "active" = true,
  "updated_at" = CURRENT_TIMESTAMP;
