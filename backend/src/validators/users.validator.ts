import { CnhStatus } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department_id: z.string().uuid(),
  role_id: z.string().uuid(),
  active: z.boolean().optional(),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .extend({ password: z.string().min(8).optional() })
  .partial()
  .extend({ cnh_status: z.nativeEnum(CnhStatus).optional() });
