import { z } from "zod";

const roleEnum = z.enum(["admin", "teacher", "parent"]);

const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const registerUserSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "userId is required"),
    password: z.string().min(8, "password must be at least 8 characters"),
    role: roleEnum,
    firstName: z.string().min(1, "firstName is required"),
    lastName: z.string().min(1, "lastName is required"),
  }),
});

export const getUsersSchema = z.object({
  query: z.object({
    role: roleEnum.optional(),
    isActive: booleanQuery.optional(),
    fullName: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("id must be a UUID"),
  }),
  body: z
    .object({
      role: roleEnum.optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      { message: "At least one field is required" },
    ),
});
