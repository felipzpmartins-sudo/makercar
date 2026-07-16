import { z } from "zod";

const reservationStatusValues = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ACTIVE",
  "FINISHED",
  "CANCELLED",
] as const;

export const createReservationSchema = z.object({
  vehicle_id: z.string().uuid(),
  pickup_date: z.coerce.date(),
  return_date: z.coerce.date(),
  reason: z.string().min(3),
});

export const updateReservationSchema = z
  .object({
    pickup_date: z.coerce.date().optional(),
    return_date: z.coerce.date().optional(),
    reason: z.string().min(3).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizacao.",
  });

export const approveReservationSchema = z.object({});

export const rejectReservationSchema = z.object({
  reason: z.string().min(3),
});

export const listReservationsQuerySchema = z.object({
  status: z.enum(reservationStatusValues).optional(),
  user_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
});

export const pickupReservationSchema = z.object({
  vehicle_id: z.string().uuid(),
  took_reserved_vehicle: z.boolean(),
  occurred_at: z.coerce.date(),
  mileage: z.coerce.number().int().min(0),
  fuel_level: z.string().min(1),
  vehicle_condition: z.string().min(2),
  damages: z.string().optional().default(""),
  notes: z.string().max(4000).optional(),
  photo_data_url: z.string().min(30),
});

export const returnReservationSchema = z.object({
  occurred_at: z.coerce.date(),
  mileage: z.coerce.number().int().min(0),
  fuel_level: z.string().min(1),
  vehicle_condition: z.string().min(2),
  damages: z.string().optional().default(""),
  notes: z.string().max(4000).optional(),
  photo_data_url: z.string().min(30),
});
