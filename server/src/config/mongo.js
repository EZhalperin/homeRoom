import { MongoClient } from "mongodb";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
import { COLLECTION } from "../models/Class.js";

/** @type {MongoClient|null} */
let client = null;
/** @type {import("mongodb").Db|null} */
let db = null;
/** @type {Promise<import("mongodb").Db>|null} */
let connecting = null;

function databaseOf(mongoClient) {
  return env.MONGODB_DB_NAME ? mongoClient.db(env.MONGODB_DB_NAME) : mongoClient.db();
}

/**
 * Opens the single shared MongoClient. Concurrent callers share one promise.
 * On failure, state is reset so a later retry can succeed.
 *
 * @param {typeof MongoClient} [ClientCtor]
 * @returns {Promise<import("mongodb").Db>}
 */
export async function connectMongo(ClientCtor = MongoClient) {
  if (db) return db;
  if (!connecting) {
    connecting = (async () => {
      const next = new ClientCtor(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
      try {
        if (typeof next.on === "function") {
          next.on("error", (err) => logger.error("MongoDB client error:", err));
        }
        await next.connect();
        client = next;
        db = databaseOf(next);
        logger.info("MongoDB connected");
        return db;
      } catch (err) {
        client = null;
        db = null;
        try {
          await next.close();
        } catch {
          // close after a failed connect is best-effort
        }
        throw err;
      }
    })();
  }
  try {
    return await connecting;
  } catch (err) {
    connecting = null;
    throw err;
  }
}

/** @returns {import("mongodb").Db} */
export function getDb() {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connectMongo() first.");
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

/** Closes the client (idempotent). */
export async function closeMongo() {
  if (connecting) {
    try {
      await connecting;
    } catch {
      // ignore a failed in-flight connect during shutdown
    }
  }
  const current = client;
  client = null;
  db = null;
  connecting = null;
  if (current) {
    await current.close();
    logger.info("MongoDB connection closed");
  }
}

const IGNORABLE_DROP_CODES = new Set([26, 27]);

/**
 * Creates the indexes the app relies on. Safe to call on every boot.
 */
export async function ensureIndexes() {
  const classes = getCollection(COLLECTION);

  try {
    await classes.dropIndex("students.studentId_1");
  } catch (err) {
    if (!IGNORABLE_DROP_CODES.has(err?.code)) throw err;
  }

  await classes.createIndex(
    { teacherId: 1 },
    {
      name: "uniq_active_class_per_teacher",
      unique: true,
      partialFilterExpression: { isActive: true },
    },
  );

  await classes.createIndex({ "students.id": 1 });

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
