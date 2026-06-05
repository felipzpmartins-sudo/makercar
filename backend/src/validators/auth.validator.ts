import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().min(2).optional().default("Administrativo"),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});
