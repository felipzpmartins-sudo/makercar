FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3333

CMD ["sh", "-c", "npm run prisma:deploy && npm run prisma:bootstrap && npm run start"]
