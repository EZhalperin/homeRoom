import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "userId is required"),
    password: z.string().min(1, "password is required"),
  }),
});
