import { getCollection } from "../config/mongo.js";
import { COLLECTION } from "../models/Notification.js";
import { toObjectId } from "../utils/mongoHelpers.js";

/** @module repositories/notificationRepository */

const col = () => getCollection(COLLECTION);

/**
 * Inserts multiple notification documents in one batch.
 * @param {import("../models/Notification.js").NotificationDoc[]} docs
 * @returns {Promise<import("../models/Notification.js").NotificationDoc[]>}
 */
export async function insertMany(docs) {
  if (!docs || docs.length === 0) return [];
  await col().insertMany(docs);
  return docs;
}

/**
 * Lists notifications for a given user with cursor pagination.
 * @param {string} userId
 * @param {{ unreadOnly?: boolean, limit?: number, before?: string|Date }} [opts]
 * @returns {Promise<import("../models/Notification.js").NotificationDoc[]>}
 */
export async function listByUserId(userId, { unreadOnly = false, limit = 20, before } = {}) {
  const query = { userId };
  if (unreadOnly) {
    query.readAt = null;
  }
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

  return col()
    .find(query)
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .toArray();
}

/**
 * Counts unread notifications for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function countUnreadByUserId(userId) {
  return col().countDocuments({ userId, readAt: null });
}

/**
 * Marks a notification as read, scoped strictly to the owning user.
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<import("../models/Notification.js").NotificationDoc|null>}
 */
export async function markAsRead(id, userId) {
  const doc = await col().findOneAndUpdate(
    { _id: toObjectId(id, "notification id"), userId },
    { $set: { readAt: new Date() } },
    { returnDocument: "after" },
  );
  return doc;
}

/**
 * Marks all unread notifications as read for a user.
 * @param {string} userId
 * @returns {Promise<number>} count of modified documents
 */
export async function markAllAsRead(userId) {
  const now = new Date();
  const res = await col().updateMany(
    { userId, readAt: null },
    { $set: { readAt: now } },
  );
  return res.modifiedCount;
}