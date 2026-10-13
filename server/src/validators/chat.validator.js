import { z } from "zod";
import { mongoObjectId } from "./common.js";

export const createRoomSchema = z.object({
  body: z.object({
    studentUuid: z.string().uuid("Invalid student UUID").optional(),
  }),
});

export const roomIdParamSchema = z.object({
  params: z.object({
    roomId: mongoObjectId,
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({
    roomId: mongoObjectId,
  }),
  body: z.object({
    text: z.string().trim().min(1, "Message text cannot be empty").max(2000, "Message text too long"),
  }),
});

export const getMessagesQuerySchema = z.object({
  params: z.object({
    roomId: mongoObjectId,
  }),
  query: z.object({
    before: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});