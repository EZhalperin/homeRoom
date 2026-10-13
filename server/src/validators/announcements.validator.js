import { z } from "zod";
import { mongoObjectId } from "./common.js";

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, "Title is required").max(150, "Title must be at most 150 characters"),
    body: z.string().trim().min(1, "Body is required").max(3000, "Body must be at most 3000 characters"),
    audience: z
      .object({
        type: z.enum(["all", "grades", "classes"]),
        grades: z.array(z.string().trim().min(1)).optional(),
        classIds: z.array(mongoObjectId).optional(),
      })
      .optional(),
  }),
});

export const listAnnouncementsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
    before: z.string().optional(),
  }),
});

export const announcementIdParamSchema = z.object({
  params: z.object({
    id: mongoObjectId,
  }),
});