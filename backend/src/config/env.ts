import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16).default(
    `makercar-access-${process.env.RAILWAY_PROJECT_ID ?? "local-fallback"}`,
  ),
  JWT_REFRESH_SECRET: z.string().min(16).default(
    `makercar-refresh-${process.env.RAILWAY_PROJECT_ID ?? "local-fallback"}`,
  ),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  PHOTO_STORAGE_DIR: z.string().default("/data/photos"),
  PUBLIC_API_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().optional(),
  ),
});

export const env = envSchema.parse(process.env);

export const corsOrigins =
  env.CORS_ORIGIN === "*"
    ? "*"
    : env.CORS_ORIGIN.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

export const publicApiUrl =
  env.PUBLIC_API_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined) ??
  `http://localhost:${env.PORT}`;
