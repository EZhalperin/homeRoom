import { z } from "zod";

/** Query-string booleans. Never use `z.coerce.boolean()` ("false" would become true). */
export const queryBoolean = z.stringbool();

/** User primary key (Supabase uuid). */
export const userUuid = z.uuid({ error: "id must be a UUID" });

export const studentUuid = z.uuid({ error: "id must be a UUID" });

/** Trim + lowercase, then validate as an email. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Invalid email" }));

export const userIdParamSchema = z.object({
  params: z.object({
    id: userUuid,
  }),
});

/** Shared password policy: min 8, max 72 (bcrypt limit), at least one letter and one digit. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one digit");