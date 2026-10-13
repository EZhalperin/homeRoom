import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });
dotenv.config({ quiet: true });

/**
 * Fail-fast environment validation. Import this module before any other config.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    SUPABASE_URL: z.url(),
    SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    MONGODB_URI: z.string().min(1),
    MONGODB_DB_NAME: z.string().min(1).optional(),
    JWT_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default("8h"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    APP_BASE_URL: z.url().default("http://localhost:5173"),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_SECURE: z
      .preprocess((val) => {
        if (typeof val === "string") return val.toLowerCase() === "true";
        if (val === undefined || val === null) return false;
        return Boolean(val);
      }, z.boolean())
      .optional()
      .default(false),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().min(1).default("no-reply@homeroom.local"),
    SEED_ADMIN_USER_ID: z.string().optional(),
    SEED_ADMIN_PASSWORD: z.string().optional(),
    SEED_ADMIN_FIRST_NAME: z.string().optional(),
    SEED_ADMIN_LAST_NAME: z.string().optional(),
    SEED_ADMIN_EMAIL: z.email().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (!data.APP_BASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "APP_BASE_URL is required in production",
          path: ["APP_BASE_URL"],
        });
      }
      if (!data.SMTP_HOST) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SMTP_HOST is required in production",
          path: ["SMTP_HOST"],
        });
      }
      if (!data.SMTP_PORT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SMTP_PORT is required in production",
          path: ["SMTP_PORT"],
        });
      }
      if (!data.SMTP_USER) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SMTP_USER is required in production",
          path: ["SMTP_USER"],
        });
      }
      if (!data.SMTP_PASS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SMTP_PASS is required in production",
          path: ["SMTP_PASS"],
        });
      }
      if (!data.MAIL_FROM) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "MAIL_FROM is required in production",
          path: ["MAIL_FROM"],
        });
      }
    }
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