-- Marca os veiculos que usam o checklist curto de retirada (apenas a foto do
-- painel com o KM). Os demais voltam a exigir frente, traseira e as duas
-- laterais. A partir daqui quem controla a flag e o painel do admin.
ALTER TABLE "vehicles"
ADD COLUMN "simplified_checklist" BOOLEAN NOT NULL DEFAULT FALSE;

-- BWK7761 e o carro de apoio usado so em Leme: mantem o checklist curto que ja
-- estava valendo antes desta migration.
UPDATE "vehicles"
SET "simplified_checklist" = TRUE
WHERE "plate" = 'BWK7761';
