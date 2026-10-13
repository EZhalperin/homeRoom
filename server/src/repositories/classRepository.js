import { getCollection } from "../config/mongo.js";
import { COLLECTION, buildClassDoc } from "../models/Class.js";
import { AppError } from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { isDuplicateKeyError, toObjectId } from "../utils/mongoHelpers.js";

const col = () => getCollection(COLLECTION);

/** Converts _id to a string at the repository boundary. */
function serialize(doc) {
  return doc ? { ...doc, _id: String(doc._id) } : null;
}

/**
 * @param {{ teacherId: string, className: string }} data
 * @returns {Promise<object>} the created class (without students detail)
 * @throws {AppError} 409 if the teacher already has an active class
 */
export async function create({ teacherId, className }) {
  const doc = buildClassDoc({ teacherId, className });
  try {
    await col().insertOne(doc); // insertOne adds _id to doc
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError("Teacher already has an active class", 409);
    }
    throw err;
  }
  return serialize(doc);
}

/** @param {string} id class _id */
export async function findById(id) {
  return serialize(await col().findOne({ _id: toObjectId(id, "class id") }));
}

/** @param {string} teacherId teacher national ID */
export async function findActiveByTeacherId(teacherId) {
  return serialize(await col().findOne({ teacherId, isActive: true }));
}

/**
 * Lists classes WITHOUT the students array, with `studentsCount` instead.
 * @param {{ teacherId?: string, className?: string, isActive?: boolean }} [filters]
 */
export async function list({ teacherId, className, isActive } = {}) {
  const match = {};
  if (teacherId) match.teacherId = teacherId;
  if (isActive !== undefined) match.isActive = isActive;
  if (className) {
    match.className = { $regex: escapeRegex(className), $options: "i" };
  }
  const docs = await col()
    .aggregate([
      { $match: match },
      { $addFields: { studentsCount: { $size: { $ifNull: ["$students", []] } } } },
      { $project: { students: 0 } },
    ])
    .toArray();
  return docs.map(serialize);
}

/**
 * Soft delete (isActive=false).
 * @param {string} id
 * @returns {Promise<object|null>} the class as it was before the update, or null
 */
export async function softDelete(id) {
  const doc = await col().findOneAndUpdate(
    { _id: toObjectId(id, "class id") },
    { $set: { isActive: false } },
    { returnDocument: "before" },
  );
  return serialize(doc);
}

/**
 * @param {string} classId
 * @returns {Promise<object[]|null>} students array, or null if class not found
 */
export async function findStudentsByClassId(classId) {
  const doc = await col().findOne(
    { _id: toObjectId(classId, "class id") },
    { projection: { students: 1 } },
  );
  return doc ? doc.students || [] : null;
}

/**
 * Returns active classes with full document content (including students).
 * @param {object} [filter]
 * @returns {Promise<object[]>}
 */
export async function listActiveClasses(filter = {}) {
  const query = { isActive: true, ...filter };
  const docs = await col().find(query).toArray();
  return docs.map(serialize);
}

/**
 * Returns total count of students across all active classes.
 * @returns {Promise<number>}
 */
export async function countActiveStudents() {
  const docs = await col().find({ isActive: true }, { projection: { students: 1 } }).toArray();
  let count = 0;
  for (const doc of docs) {
    if (Array.isArray(doc.students)) {
      count += doc.students.length;
    }
  }
  return count;
}