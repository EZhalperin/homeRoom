import { z } from "zod";
import { emailSchema, passwordSchema } from "./common.js";

export {
  registerUserSchema,
  getUsersSchema,
  updateUserSchema,
  userIdParamSchema,
} from "./admin.users.validator.js";

export const updateMeSchema = z.object({
  body: z
    .object({
      password: passwordSchema.optional(),
      firstName: z.string().trim().min(1).optional(),
      lastName: z.string().trim().min(1).optional(),
      email: emailSchema.optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field is required",
    }),
});