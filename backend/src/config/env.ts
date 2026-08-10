import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("*"),
  PHOTO_STORAGE_DIR: z.string().default("/data/photos"),
  PUBLIC_API_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().optional(),
  ),
}).superRefine((value, context) => {
  if (value.NODE_ENV !== "production") return;

  if (!value.JWT_ACCESS_SECRET) {
    context.addIssue({ code: "custom", path: ["JWT_ACCESS_SECRET"], message: "Obrigatório em produção." });
  }
  if (!value.JWT_REFRESH_SECRET) {
    context.addIssue({ code: "custom", path: ["JWT_REFRESH_SECRET"], message: "Obrigatório em produção." });
  }
  if (value.CORS_ORIGIN === "*") {
    context.addIssue({ code: "custom", path: ["CORS_ORIGIN"], message: "Defina a origem do frontend em produção." });
  }
}).transform((value) => ({
  ...value,
  JWT_ACCESS_SECRET: value.JWT_ACCESS_SECRET ?? "development-only-access-secret-change-me",
  JWT_REFRESH_SECRET: value.JWT_REFRESH_SECRET ?? "development-only-refresh-secret-change-me",
}));

export const env = envSchema.parse(process.env);

export const corsOrigins =
  env.CORS_ORIGIN === "*"
    ? "*"
    : env.CORS_ORIGIN.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

export const corsCredentials = corsOrigins !== "*";

export const publicApiUrl =
  env.PUBLIC_API_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : undefined) ??
  `http://localhost:${env.PORT}`;
