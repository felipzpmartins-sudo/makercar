UPDATE "users"
SET
  "password_hash" = '$2b$10$OHJffdcQWqnmjnjja049nOReBQNxXMhe9U3jBe5gL0VS/dvEBeDR6',
  "must_change_password" = true,
  "active" = true
WHERE "email" = 'felipzpmartins@gmail.com';
