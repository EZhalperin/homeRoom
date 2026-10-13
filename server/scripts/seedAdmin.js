import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { env } from "../src/config/env.js";
import { logger } from "../src/utils/logger.js";
import * as userRepository from "../src/repositories/userRepository.js";
import { hashPassword } from "../src/services/authService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ quiet: true });

async function seedAdmin() {
  const userId = env.SEED_ADMIN_USER_ID || process.env.SEED_ADMIN_USER_ID;
  const password = env.SEED_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
  const email =
    env.SEED_ADMIN_EMAIL ||
    process.env.SEED_ADMIN_EMAIL ||
    (userId ? `${userId}@homeroom.local` : "admin@homeroom.local");
  const firstName = env.SEED_ADMIN_FIRST_NAME || process.env.SEED_ADMIN_FIRST_NAME || "School";
  const lastName = env.SEED_ADMIN_LAST_NAME || process.env.SEED_ADMIN_LAST_NAME || "Admin";

  if (!userId || !password) {
    logger.error("SEED_ADMIN_USER_ID and SEED_ADMIN_PASSWORD are required");
    process.exit(1);
  }

  const existing = await userRepository.findByUserId(userId);
  if (existing) {
    logger.info(`Admin user ${userId} already exists (${existing.id})`);
    return;
  }

  const created = await userRepository.insert({
    userId,
    email,
    password: await hashPassword(password),
    role: "admin",
    firstName,
    lastName,
    isActive: true,
  });
  logger.info(`Admin user created: ${created.userId} <${created.email}> id=${created.id}`);
}

seedAdmin().catch((err) => {
  logger.error(err);
  process.exit(1);
});