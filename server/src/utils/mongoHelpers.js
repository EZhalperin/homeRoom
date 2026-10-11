import { ObjectId } from "mongodb";
import { AppError } from "./AppError.js";

/**
 * Converts a string to an ObjectId. Invalid input -> AppError(400).
 * @param {string|ObjectId} id
 * @param {string} [label]
 * @returns {ObjectId}
 */
export function toObjectId(id, label = "id") {
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && /^[a-f\d]{24}$/i.test(id)) return new ObjectId(id);
  throw new AppError(`Invalid ${label}`, 400);
}

/**
 * @param {unknown} err
 * @returns {boolean} true for a MongoDB duplicate-key error (E11000).
 */
export function isDuplicateKeyError(err) {
  return Boolean(err) && err.code === 11000;
}