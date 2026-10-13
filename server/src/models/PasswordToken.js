/**
 * Document shapes for the `passwordTokens` collection (native driver, no schemas).
 * Validation lives in the Zod validators.
 * @module models/PasswordToken
 */

export const COLLECTION = "passwordTokens";
export const TOKEN_PURPOSES = Object.freeze(["invite", "reset"]);

/**
 * @typedef {Object} PasswordTokenDoc
 * @property {import("mongodb").ObjectId} [_id]
 * @property {string} userId
 * @property {"invite"|"reset"} purpose
 * @property {string} tokenHash
 * @property {Date} expiresAt
 * @property {Date|null} usedAt
 * @property {Date} createdAt
 */

/**
 * @param {{ userId: string, purpose: "invite"|"reset", tokenHash: string, expiresAt: Date }} param0
 * @returns {PasswordTokenDoc}
 */
export function buildPasswordTokenDoc({ userId, purpose, tokenHash, expiresAt }) {
  return {
    userId,
    purpose,
    tokenHash,
    expiresAt,
    usedAt: null,
    createdAt: new Date(),
  };
}