import { findByUserId, toPublicUser, verifyToken as verifyJwt } from "../services/authService.js";
import { logger } from "../utils/logger.js";
import { registerChatHandlers } from "./chat.socket.js";

/**
 * Configures Socket.io middleware and registers connection handlers.
 * @param {import("socket.io").Server} io
 */
export function setupSockets(io) {
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const authToken = socket.handshake.auth?.token;
      let token = authToken;
      if (!token && authHeader) {
        const [scheme, val] = authHeader.split(" ");
        if (scheme === "Bearer") token = val;
      }

      if (!token) {
        return next(new Error("Authentication required"));
      }

      let payload;
      try {
        payload = verifyJwt(token);
      } catch (err) {
        return next(new Error("Authentication required"));
      }

      if (!payload?.userId) {
        return next(new Error("Authentication required"));
      }

      const user = await findByUserId(payload.userId);
      if (!user) {
        return next(new Error("Authentication required"));
      }

      if (user.isActive === false) {
        return next(new Error("Account is suspended"));
      }

      socket.data.user = toPublicUser(user);
      next();
    } catch (err) {
      logger.error("Socket authentication error:", err);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (user?.userId) {
      socket.join(`user:${user.userId}`);
      logger.info(`Socket connected: ${socket.id} (user:${user.userId})`);
    }

    registerChatHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });
}