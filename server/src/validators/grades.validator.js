import { z } from "zod";

const studentParam = z.object({
  id: z.string().uuid("id must be a UUID"),
});

export const createGradeSchema = z.object({
  params: studentParam,
  body: z.object({
    subject: z.string().min(1, "subject is required"),
    taskName: z.string().min(1, "taskName is required"),
    score: z.number().int().min(0).max(100),
    weight: z.number().min(0).max(1),
    date: z.coerce.date(),
  }),
});

export const updateGradeSchema = z.object({
  params: studentParam,
  body: z.object({
    score: z.number().int().min(0).max(100),
    subject: z.string().min(1, "subject is required"),
    date: z.coerce.date(),
    taskName: z.string().min(1).optional(),
  }),
});
