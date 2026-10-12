import { env } from "../src/config/env.js";
import { logger } from "../src/utils/logger.js";
import * as userRepository from "../src/repositories/userRepository.js";
import { hashPassword } from "../src/services/authService.js";

async function seedAdmin() {
  const userId = env.SEED_ADMIN_USER_ID;
  const password = env.SEED_ADMIN_PASSWORD;
  const email = env.SEED_ADMIN_EMAIL;
  const firstName = env.SEED_ADMIN_FIRST_NAME || "School";
  const lastName = env.SEED_ADMIN_LAST_NAME || "Admin";

  if (!userId || !password || !email) {
    logger.error("SEED_ADMIN_USER_ID, SEED_ADMIN_PASSWORD and SEED_ADMIN_EMAIL are required");
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
