import { ReservationStatus } from "@prisma/client";
import { z } from "zod";

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
    status: z.nativeEnum(ReservationStatus).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualização.",
  });

export const listReservationsQuerySchema = z.object({
  status: z.nativeEnum(ReservationStatus).optional(),
  user_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
});
