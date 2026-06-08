INSERT INTO "roles" ("name")
VALUES ('Imperador Supremo')
ON CONFLICT ("name") DO NOTHING;

UPDATE "users"
SET "role_id" = (
  SELECT "id"
  FROM "roles"
  WHERE "name" = 'Imperador Supremo'
)
WHERE "email" = 'felipzpmartins@gmail.com';
