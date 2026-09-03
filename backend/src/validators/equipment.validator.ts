import { z } from "zod";

const equipmentStatusValues = [
  "AVAILABLE",
  "RESERVED",
  "IN_USE",
  "MAINTENANCE",
  "UNAVAILABLE",
] as const;

const equipmentReservationStatusValues = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
] as const;

const specsSchema = z
  .array(
    z.object({
      label: z.string().trim().min(1).max(60),
      value: z.string().trim().min(1).max(120),
    }),
  )
  .max(12);

export const createEquipmentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minusculas, numeros e hifen."),
  description: z.string().trim().max(2000).optional(),
  category_id: z.string().uuid(),
  image_url: z.string().trim().max(500).optional(),
  hero_image_url: z.string().trim().max(500).optional(),
  status: z.enum(equipmentStatusValues).optional(),
  location: z.string().trim().max(180).optional(),
  notes: z.string().trim().max(2000).optional(),
  usage_rules: z.string().trim().max(4000).optional(),
  specs: specsSchema.optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const updateEquipmentSchema = createEquipmentSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizacao.",
  });

export const createEquipmentCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minusculas, numeros e hifen."),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(40).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const unlockEquipmentModuleSchema = z.object({
  password: z.string().min(1),
});

export const createEquipmentReservationSchema = z.object({
  equipment_id: z.string().uuid(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  operator_name: z.string().trim().min(3).max(160),
  purpose: z.string().trim().min(5).max(2000),
  usage_location: z.string().trim().min(2).max(180),
  notes: z.string().trim().max(2000).optional(),
  terms_accepted: z.literal(true, {
    message: "É necessário aceitar o Termo de Responsabilidade.",
  }),
  terms_version: z.string().trim().min(1).max(20),
  /* Enquanto o modulo esta em "em breve", a senha de acesso antecipado
     viaja junto da reserva — sem ela o backend recusa a criacao. */
  access_password: z.string().optional(),
});

export const listEquipmentReservationsQuerySchema = z.object({
  status: z.enum(equipmentReservationStatusValues).optional(),
  equipment_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  scope: z.enum(["own", "all"]).optional(),
});

export const rejectEquipmentReservationSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const cancelEquipmentReservationSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});
