import * as notificationRepository from "../repositories/notificationRepository.js";
import { buildNotificationDoc } from "../models/Notification.js";
import { emitToUser } from "../sockets/realtime.js";
import { AppError } from "../utils/AppError.js";

/** @module services/notificationService */

/**
 * Creates notifications for multiple users and emits realtime event to each user.
 * @param {string[]} userIds
 * @param {{ type: string, title: string, body: string, link?: string|null, data?: object|null }} payload
 * @returns {Promise<import("../models/Notification.js").NotificationDoc[]>}
 */
export async function createMany(userIds, payload) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  // Deduplicate and filter out falsy userIds
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) return [];

  const docs = uniqueUserIds.map((userId) =>
    buildNotificationDoc({
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      data: payload.data,
    }),
  );

  await notificationRepository.insertMany(docs);

  // Realtime push (no-op safely if realtime is uninitialized)
  for (const doc of docs) {
    emitToUser(doc.userId, "notification:new", doc);
  }

  return docs;
}

/**
 * Lists notifications for a given user.
 * @param {string} userId
 * @param {{ unreadOnly?: boolean, limit?: number, before?: string|Date }} [opts]
 */
export async function list(userId, opts) {
  return notificationRepository.listByUserId(userId, opts);
}

/**
 * Returns count of unread notifications for a user.
 * @param {string} userId
 * @returns {Promise<{ count: number }>}
 */
export async function unreadCount(userId) {
  const count = await notificationRepository.countUnreadByUserId(userId);
  return { count };
}

/**
 * Marks a single notification as read.
 * @param {string} id
 * @param {string} userId
 * @throws {AppError} 404 if not found or not owned by user
 */
export async function markRead(id, userId) {
  const doc = await notificationRepository.markAsRead(id, userId);
  if (!doc) {
    throw new AppError("Notification not found", 404);
  }
  return doc;
}

/**
 * Marks all notifications as read for a user.
 * @param {string} userId
 */
export async function markAllRead(userId) {
  const modifiedCount = await notificationRepository.markAllAsRead(userId);
  return { modifiedCount };
}