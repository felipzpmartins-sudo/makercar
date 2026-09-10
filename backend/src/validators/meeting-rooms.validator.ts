import { z } from "zod";

const roomStatusValues = [
  "AVAILABLE",
  "RESERVED",
  "IN_USE",
  "MAINTENANCE",
  "UNAVAILABLE",
] as const;

const roomReservationStatusValues = [
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;

/** Hora do relogio no formato "HH:MM" (24h). */
const clockTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM.");

const amenitiesSchema = z.array(z.string().trim().min(1).max(60)).max(12);

export const createMeetingRoomSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minusculas, numeros e hifen."),
  description: z.string().trim().max(2000).optional(),
  image_url: z.string().trim().max(500).optional(),
  hero_image_url: z.string().trim().max(500).optional(),
  status: z.enum(roomStatusValues).optional(),
  location: z.string().trim().max(180).optional(),
  capacity: z.coerce.number().int().min(1).max(200).optional(),
  amenities: amenitiesSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
  usage_rules: z.string().trim().max(4000).optional(),
  opening_time: clockTimeSchema.optional(),
  closing_time: clockTimeSchema.optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const updateMeetingRoomSchema = createMeetingRoomSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizacao.",
  });

export const createMeetingRoomReservationSchema = z.object({
  room_id: z.string().uuid(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  title: z.string().trim().min(3).max(160),
  attendees: z.coerce.number().int().min(1).max(200),
  notes: z.string().trim().max(2000).optional(),
});

export const listMeetingRoomReservationsQuerySchema = z.object({
  status: z.enum(roomReservationStatusValues).optional(),
  room_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  scope: z.enum(["own", "all"]).optional(),
});

export const cancelMeetingRoomReservationSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});
