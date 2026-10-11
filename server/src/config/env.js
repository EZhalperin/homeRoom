import { z } from "zod";

/**
 * Fail-fast environment validation. Import this module before any other config.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  // Optional: existing supabase.js uses the anon key. Kept so a service-role key can be wired later.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("8h"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SEED_ADMIN_USER_ID: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_ADMIN_FIRST_NAME: z.string().optional(),
  SEED_ADMIN_LAST_NAME: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  process.stderr.write(`Invalid environment variables: ${details}\n`);
  process.exit(1);
}

export const env = parsed.data;
