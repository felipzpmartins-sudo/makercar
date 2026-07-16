INSERT INTO "users" (
  "name",
  "email",
  "password_hash",
  "department_id",
  "role_id",
  "active",
  "must_change_password"
)
VALUES (
  'Juliana',
  'rh@makergrupo.com.br',
  '$2b$10$bd9VLxD2XfmagvgHrOrWn.PjyMmJRYO8vZi985sYW.416Dz9on0Ki',
  (SELECT "id" FROM "departments" WHERE "name" = 'Administrativo'),
  (SELECT "id" FROM "roles" WHERE "name" = 'Administrador'),
  true,
  true
)
ON CONFLICT ("email") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "department_id" = EXCLUDED."department_id",
  "role_id" = EXCLUDED."role_id",
  "active" = true,
  "must_change_password" = true;
