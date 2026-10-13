import { z } from "zod";

export const analyticsQuerySchema = z.object({
  query: z.object({
    months: z.coerce.number().int().min(1).max(12).default(6),
  }),
});