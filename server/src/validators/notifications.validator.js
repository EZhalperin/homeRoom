import { z } from "zod";
import { mongoObjectId, queryBoolean } from "./common.js";

export const listNotificationsSchema = z.object({
  query: z.object({
    unreadOnly: queryBoolean.optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    before: z.string().optional(),
  }),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: mongoObjectId,
  }),
});