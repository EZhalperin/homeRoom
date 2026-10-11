import { MongoClient } from "mongodb";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
import { COLLECTION } from "../models/Class.js";

/** @type {MongoClient|null} */
let client = null;
/** @type {import("mongodb").Db|null} */
let db = null;

/**
 * Opens the single shared MongoClient (idempotent).
 * @returns {Promise<import("mongodb").Db>}
 */
export async function connectMongo() {
  if (db) return db;
  client = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  client.on("error", (err) => logger.error("MongoDB client error:", err));
  await client.connect();
  db = client.db(env.MONGODB_DB_NAME);
  logger.info("MongoDB connected");
  return db;
}

/** @returns {import("mongodb").Db} */
export function getDb() {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connectMongo() before using the database.");
  }
  return db;
}

/**
 * @param {string} name
 * @returns {import("mongodb").Collection}
 */
export function getCollection(name) {
  return getDb().collection(name);
}

/** Closes the client (graceful shutdown). */
export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info("MongoDB connection closed");
  }
}

/** Index 'not found' errors that are safe to ignore when dropping legacy indexes. */
const IGNORABLE_DROP_CODES = new Set([26, 27]);

/**
 * Creates the indexes the app relies on. Safe to call on every boot.
 */
export async function ensureIndexes() {
  const classes = getCollection(COLLECTION);

  // Legacy non-unique index created by the old Mongoose schema; it conflicts
  // with the new unique partial index on the same key pattern.
  try {
    await classes.dropIndex("students.studentId_1");
  } catch (err) {
    if (!IGNORABLE_DROP_CODES.has(err?.code)) throw err;
  }

  // One ACTIVE class per teacher (race-safe).
  await classes.createIndex(
    { teacherId: 1 },
    {
      name: "uniq_active_class_per_teacher",
      unique: true,
      partialFilterExpression: { isActive: true },
    },
  );

  // Lookups by student uuid (default name, same as the old Mongoose index).
  await classes.createIndex({ "students.id": 1 });

  // A studentId may exist in only ONE active class. A multikey unique index
  // enforces uniqueness across documents (not inside one document's array,
  // which studentRepository.addStudentToClass guards with a conditional update).
  // The $exists clause keeps classes with an empty students[] out of the index.
  await classes.createIndex(
    { "students.studentId": 1 },
    {
      name: "uniq_active_student_id",
      unique: true,
      partialFilterExpression: { isActive: true, "students.studentId": { $exists: true } },
    },
  );

  logger.info("MongoDB indexes ensured");
}