# MakerCar Backend

API REST para gestão e reserva de veículos corporativos da MKR.

## Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT authentication
- Bcrypt via `bcryptjs`
- Zod validation
- Docker

## Setup local

```bash
cd backend
cp .env.example .env
npm install
docker compose up -d postgres
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

A API sobe em `http://localhost:3333/api`.

## Usuário inicial

- E-mail: `ceo@mkr.com`
- Senha: `MakerCar@2026`

## Endpoints

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/roles`
- `GET /api/departments`
- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `POST /api/vehicles`
- `PUT /api/vehicles/:id`
- `DELETE /api/vehicles/:id`
- `GET /api/reservations`
- `GET /api/reservations/:id`
- `POST /api/reservations`
- `PUT /api/reservations/:id`
- `POST /api/reservations/:id/approve`
- `POST /api/reservations/:id/cancel`
- `POST /api/reservations/:id/finish`
- `POST /api/checklists`
- `GET /api/checklists/:id`
- `GET /api/dashboard/summary`

## Autenticação

Use o `access_token` retornado no login:

```http
Authorization: Bearer <access_token>
```

## RBAC

- CEO e Administrador: acesso total.
- Gestor: visualiza veículos e reservas, aprova, cancela e finaliza reservas.
- Colaborador: visualiza veículos, cria reservas e gerencia apenas as próprias reservas.

## Validação

Todas as entradas principais passam por schemas Zod. Erros são retornados em JSON com `message` e, quando aplicável, `details`.

## Railway

Para trocar o banco do Neon para Railway:

1. Crie um serviço PostgreSQL no Railway.
2. Copie a `DATABASE_URL` fornecida pelo Railway para as variáveis de ambiente do backend.
3. Mantenha `NODE_ENV=production` no deploy e `CORS_ORIGIN` com a URL do front.
4. Rode `npm run prisma:deploy` no start da API para aplicar as migrations no banco novo.
5. Se houver dados no Neon que precisam ser preservados, exporte e importe antes de virar a chave.
