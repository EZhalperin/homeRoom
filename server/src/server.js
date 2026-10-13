import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { registerProcessHandlers } from "./middleware/errorHandler.js";
import { connectMongo, ensureIndexes, closeMongo } from "./config/mongo.js";
import { app } from "./app.js";
import { initRealtime } from "./sockets/realtime.js";
import { setupSockets } from "./sockets/index.js";

registerProcessHandlers();

let shuttingDown = false;
let ioInstance = null;
let httpServer = null;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);
  try {
    if (ioInstance) {
      await new Promise((resolve) => ioInstance.close(resolve));
    }
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    await closeMongo();
  } catch (err) {
    logger.error(err);
  }
  process.exit(0);
}

async function main() {
  await connectMongo();
  await ensureIndexes();

  httpServer = http.createServer(app);
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  initRealtime(ioInstance);
  setupSockets(ioInstance);

  httpServer.listen(env.PORT, () => {
    logger.info(`server is up and listening on port ${env.PORT}`);
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  httpServer.on("error", (err) => {
    logger.error(err);
    process.exit(1);
  });
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});