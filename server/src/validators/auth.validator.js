import { z } from "zod";
import { emailSchema, passwordSchema } from "./common.js";

export const loginSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "userId is required"),
    password: z.string().min(1, "password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const passwordTokenParamSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Token is required"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
  }),
});