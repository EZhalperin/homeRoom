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
