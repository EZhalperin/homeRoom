import { z } from "zod";
import { studentUuid } from "./common.js";

export const createFormSchema = z.object({
  body: z.object({
    title: z.string().min(1, "title is required"),
    description: z.string().min(1, "description is required"),
    deadline: z.coerce.date(),
  }),
});

export const updateFormSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, "title is required"),
      deadline: z.coerce.date(),
      description: z.string().min(1).optional(),
      newDeadline: z.coerce.date().optional(),
    })
    .refine((body) => body.description !== undefined || body.newDeadline !== undefined, {
      message: "description and/or a new deadline is required",
    }),
});

export const approveFormSchema = z.object({
  params: z.object({
    id: studentUuid,
    title: z.string().min(1, "title is required"),
  }),
});
