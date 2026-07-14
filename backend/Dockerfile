FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
ENV DATABASE_URL=${DATABASE_URL}
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3333

CMD ["node", "scripts/start.mjs"]
