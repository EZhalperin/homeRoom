import { z } from "zod";

export {
  registerUserSchema,
  getUsersSchema,
  updateUserSchema,
} from "./admin.users.validator.js";

export const updateMeSchema = z.object({
  body: z
    .object({
      password: z.string().min(8, "password must be at least 8 characters").optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
    })
    .refine(
      (body) => Object.keys(body).length > 0,
      { message: "At least one field is required" },
    ),
});
