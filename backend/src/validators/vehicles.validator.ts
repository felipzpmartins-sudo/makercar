import { VehicleStatus } from "@prisma/client";
import { z } from "zod";

export const createVehicleSchema = z.object({
  name: z.string().min(2),
  plate: z.string().min(7).max(10),
  color: z.string().min(2),
  status: z.nativeEnum(VehicleStatus).optional(),
  mileage: z.coerce.number().int().nonnegative(),
  fuel_type: z.string().min(2),
  transmission: z.string().min(2),
  capacity: z.coerce.number().int().positive(),
  image_url: z.string().url().optional().nullable(),
  active: z.boolean().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();
