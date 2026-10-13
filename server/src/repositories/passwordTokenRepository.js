import { getCollection } from "../config/mongo.js";
import { COLLECTION, buildPasswordTokenDoc } from "../models/PasswordToken.js";

function col() {
  return getCollection(COLLECTION);
}

/**
 * Creates a new password token for a user and purpose.
 * Invalidates any earlier unused tokens for the same user and purpose.
 *
 * @param {{ userId: string, purpose: "invite"|"reset", tokenHash: string, expiresAt: Date }} params
 * @returns {Promise<import("../models/PasswordToken.js").PasswordTokenDoc>}
 */
export async function createToken({ userId, purpose, tokenHash, expiresAt }) {
  // Invalidate earlier unused tokens for same user + purpose
  await col().updateMany(
    { userId, purpose, usedAt: null },
    { $set: { usedAt: new Date() } },
  );

  const doc = buildPasswordTokenDoc({ userId, purpose, tokenHash, expiresAt });
  await col().insertOne(doc);
  return doc;
}

/**
 * Finds a token doc by its sha256 hash without consuming it.
 * @param {string} tokenHash
 * @returns {Promise<import("../models/PasswordToken.js").PasswordTokenDoc|null>}
 */
export async function findByTokenHash(tokenHash) {
  return col().findOne({ tokenHash });
}

/**
 * Atomically consumes a token if it is unused and not expired.
 * @param {string} tokenHash
 * @param {Date} [now]
 * @returns {Promise<import("../models/PasswordToken.js").PasswordTokenDoc|null>}
 */
export async function consumeToken(tokenHash, now = new Date()) {
  const doc = await col().findOneAndUpdate(
    { tokenHash, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { returnDocument: "after" },
  );
  return doc;
}

/**
 * Invalidates all unused tokens for a user across all purposes.
 * @param {string} userId
 * @param {Date} [now]
 */
export async function invalidateAllForUser(userId, now = new Date()) {
  await col().updateMany(
    { userId, usedAt: null },
    { $set: { usedAt: now } },
  );
}

/**
 * Finds the most recently created token for a user and purpose.
 * @param {string} userId
 * @param {"invite"|"reset"} purpose
 * @returns {Promise<import("../models/PasswordToken.js").PasswordTokenDoc|null>}
 */
export async function findLatestByUserIdAndPurpose(userId, purpose) {
  return col().findOne(
    { userId, purpose },
    { sort: { createdAt: -1 } },
  );
}