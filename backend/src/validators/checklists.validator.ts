import { z } from "zod";

export const createChecklistSchema = z.object({
  reservation_id: z.string().uuid(),
  fuel_level: z.coerce.number().int().min(0).max(100),
  tires_ok: z.boolean(),
  oil_ok: z.boolean(),
  lights_ok: z.boolean(),
  documents_ok: z.boolean(),
  notes: z.string().optional().nullable(),
});
