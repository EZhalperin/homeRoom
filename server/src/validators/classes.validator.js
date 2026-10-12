import { z } from "zod";
import { queryBoolean } from "./common.js";

export const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid class id");

export const createClassSchema = z.object({
  body: z.object({
    teacherId: z.string().min(1, "teacherId is required"),
    className: z.string().min(1, "className is required"),
  }),
});

export const listClassesSchema = z.object({
  query: z.object({
    className: z.string().optional(),
    isActive: queryBoolean.optional(),
    teacherId: z.string().optional(),
  }),
});

export const classIdParamSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
});
