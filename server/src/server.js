import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { registerProcessHandlers } from "./middleware/errorHandler.js";
import { connectMongo, ensureIndexes, closeMongo } from "./config/mongo.js";
import { app } from "./app.js";

registerProcessHandlers();

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);
  try {
    await closeMongo();
  } catch (err) {
    logger.error(err);
  }
  process.exit(0);
}

async function main() {
  await connectMongo();
  await ensureIndexes();

  const server = app.listen(env.PORT, () => {
    logger.info(`server is up and listening on port ${env.PORT}`);
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  server.on("error", (err) => {
    logger.error(err);
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
