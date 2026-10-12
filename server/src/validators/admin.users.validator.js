import { z } from "zod";
import { emailSchema, queryBoolean, userIdParamSchema, userUuid } from "./common.js";

const roleEnum = z.enum(["admin", "teacher", "parent"]);

export { userIdParamSchema };

export const registerUserSchema = z.object({
  body: z.object({
    userId: z.string().trim().min(1, "userId is required"),
    email: emailSchema,
    password: z.string().min(8, "password must be at least 8 characters"),
    role: roleEnum,
    firstName: z.string().trim().min(1, "firstName is required"),
    lastName: z.string().trim().min(1, "lastName is required"),
  }),
});

export const getUsersSchema = z.object({
  query: z.object({
    role: roleEnum.optional(),
    isActive: queryBoolean.optional(),
    fullName: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: userUuid,
  }),
  body: z
    .object({
      role: roleEnum.optional(),
      firstName: z.string().trim().min(1).optional(),
      lastName: z.string().trim().min(1).optional(),
      email: emailSchema.optional(),
      isActive: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field is required",
    }),
});
