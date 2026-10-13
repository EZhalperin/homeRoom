import { ObjectId } from "mongodb";

/**
 * Document shapes for the `chatMessages` collection (native driver, no schemas).
 * @module models/ChatMessage
 */

export const COLLECTION = "chatMessages";

/**
 * @typedef {Object} ChatMessageDoc
 * @property {import("mongodb").ObjectId} [_id]
 * @property {import("mongodb").ObjectId|string} roomId
 * @property {string} senderUserId
 * @property {'teacher'|'parent'} senderRole
 * @property {string} text
 * @property {Date} createdAt
 */

export function buildChatMessageDoc({ roomId, senderUserId, senderRole, text }) {
  return {
    _id: new ObjectId(),
    roomId: typeof roomId === "string" ? new ObjectId(roomId) : roomId,
    senderUserId,
    senderRole,
    text: text.trim(),
    createdAt: new Date(),
  };
}