import * as chatService from "../services/chatService.js";
import { logger } from "../utils/logger.js";

const rateLimits = new Map();

function checkRateLimit(socketId, maxEvents = 30, windowMs = 10000) {
  const now = Date.now();
  const history = rateLimits.get(socketId) || [];
  const valid = history.filter((t) => now - t < windowMs);
  if (valid.length >= maxEvents) {
    return false;
  }
  valid.push(now);
  rateLimits.set(socketId, valid);
  return true;
}

/**
 * Registers chat event listeners on an authenticated socket.
 * @param {import("socket.io").Server} io
 * @param {import("socket.io").Socket} socket
 */
export function registerChatHandlers(io, socket) {
  const user = socket.data.user;

  socket.on("chat:join", async (data, ack) => {
    try {
      if (!checkRateLimit(socket.id)) {
        return ack?.({ ok: false, error: "Rate limit exceeded" });
      }
      const roomId = data?.roomId;
      if (!roomId || typeof roomId !== "string") {
        return ack?.({ ok: false, error: "roomId is required" });
      }

      await chatService.assertParticipant(roomId, user);
      socket.join(`chat:${roomId}`);
      ack?.({ ok: true, roomId });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Failed to join room" });
    }
  });

  socket.on("chat:leave", (data, ack) => {
    const roomId = data?.roomId;
    if (roomId && typeof roomId === "string") {
      socket.leave(`chat:${roomId}`);
    }
    ack?.({ ok: true, roomId });
  });

  socket.on("chat:send", async (data, ack) => {
    try {
      if (!checkRateLimit(socket.id)) {
        return ack?.({ ok: false, error: "Rate limit exceeded" });
      }
      const roomId = data?.roomId;
      const text = data?.text;

      if (!roomId || typeof roomId !== "string") {
        return ack?.({ ok: false, error: "roomId is required" });
      }
      if (!text || typeof text !== "string" || !text.trim() || text.length > 2000) {
        return ack?.({ ok: false, error: "Text must be between 1 and 2000 characters" });
      }

      const messageDoc = await chatService.sendMessage(roomId, user, text);
      ack?.({ ok: true, data: messageDoc });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Failed to send message" });
    }
  });

  socket.on("chat:typing", async (data) => {
    if (!checkRateLimit(socket.id)) return;
    const roomId = data?.roomId;
    if (!roomId || typeof roomId !== "string") return;

    socket.to(`chat:${roomId}`).emit("chat:typing", {
      roomId,
      userId: user.userId,
      isTyping: Boolean(data?.isTyping),
    });
  });

  socket.on("chat:read", async (data, ack) => {
    try {
      if (!checkRateLimit(socket.id)) {
        return ack?.({ ok: false, error: "Rate limit exceeded" });
      }
      const roomId = data?.roomId;
      if (!roomId || typeof roomId !== "string") {
        return ack?.({ ok: false, error: "roomId is required" });
      }

      const result = await chatService.markRead(roomId, user);
      ack?.({ ok: true, readAt: result.readAt });
    } catch (err) {
      ack?.({ ok: false, error: err.message || "Failed to mark as read" });
    }
  });

  socket.on("disconnect", () => {
    rateLimits.delete(socket.id);
  });
}