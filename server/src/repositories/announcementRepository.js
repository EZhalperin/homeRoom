import { getCollection } from "../config/mongo.js";
import { COLLECTION } from "../models/Announcement.js";
import { toObjectId } from "../utils/mongoHelpers.js";

/** @module repositories/announcementRepository */

const col = () => getCollection(COLLECTION);

/**
 * Inserts a new announcement document.
 * @param {import("../models/Announcement.js").AnnouncementDoc} doc
 * @returns {Promise<import("../models/Announcement.js").AnnouncementDoc>}
 */
export async function create(doc) {
  await col().insertOne(doc);
  return doc;
}

/**
 * Finds an announcement by its ObjectId.
 * @param {string} id
 * @returns {Promise<import("../models/Announcement.js").AnnouncementDoc|null>}
 */
export async function findById(id) {
  return col().findOne({ _id: toObjectId(id, "announcement id") });
}

/**
 * Deletes an announcement by its ObjectId.
 * @param {string} id
 * @returns {Promise<boolean>} true if deleted, false if not found
 */
export async function deleteById(id) {
  const res = await col().deleteOne({ _id: toObjectId(id, "announcement id") });
  return res.deletedCount > 0;
}

/**
 * Lists announcements with filtering and cursor pagination.
 * @param {{ filter?: object, limit?: number, before?: string|Date }} [opts]
 * @returns {Promise<import("../models/Announcement.js").AnnouncementDoc[]>}
 */
export async function list({ filter = {}, limit = 20, before } = {}) {
  const query = { ...filter };
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