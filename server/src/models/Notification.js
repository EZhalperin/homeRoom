import { ObjectId } from "mongodb";

/**
 * Document shapes for the `notifications` collection (native driver, no schemas).
 * @module models/Notification
 */

export const COLLECTION = "notifications";

/**
 * @typedef {Object} NotificationDoc
 * @property {import("mongodb").ObjectId} [_id]
 * @property {string} userId
 * @property {string} type
 * @property {string} title
 * @property {string} body
 * @property {string|null} link
 * @property {object|null} data
 * @property {Date|null} readAt
 * @property {Date} createdAt
 */

/**
 * @param {{ userId: string, type: string, title: string, body: string, link?: string|null, data?: object|null }} param0
 * @returns {NotificationDoc}
 */
export function buildNotificationDoc({ userId, type, title, body, link = null, data = null }) {
  return {
    _id: new ObjectId(),
    userId,
    type,
    title,
    body,
    link: link ?? null,
    data: data ?? null,
    readAt: null,
    createdAt: new Date(),
  };
}