import { getCollection } from "../config/mongo.js";
import { COLLECTION } from "../models/Class.js";
import { AppError } from "../utils/AppError.js";
import { isDuplicateKeyError, toObjectId } from "../utils/mongoHelpers.js";

const col = () => getCollection(COLLECTION);

/**
 * Reads ONE student (via $elemMatch projection) plus its class context.
 * @returns {Promise<{classId:string, className:string, teacherId:string, isActive:boolean, student:object}|null>}
 */
async function findOneStudent(match, elemMatch) {
  const doc = await col().findOne(match, {
    projection: { teacherId: 1, className: 1, isActive: 1, students: { $elemMatch: elemMatch } },
  });
  const student = doc?.students?.[0];
  if (!student) return null;
  return {
    classId: String(doc._id),
    className: doc.className,
    teacherId: doc.teacherId,
    isActive: doc.isActive,
    student,
  };
}

/**
 * @param {string} uuid student uuid
 * @param {{ activeOnly?: boolean, teacherId?: string }} [opts]
 */
export function findStudentByUuid(uuid, { activeOnly = false, teacherId } = {}) {
  const match = { "students.id": uuid };
  if (activeOnly) match.isActive = true;
  if (teacherId) match.teacherId = teacherId;
  return findOneStudent(match, { id: uuid });
}

/** Used by the parent route: the parent's login userId == the child's studentId. */
export function findActiveStudentByStudentId(studentId) {
  return findOneStudent({ isActive: true, "students.studentId": studentId }, { studentId });
}

/**
 * Atomic $push. The filter rejects a duplicate studentId inside the same class;
 * the unique partial index rejects one in another active class.
 * @param {string} classId
 * @param {object} studentDoc built by buildStudentDoc
 */
export async function addStudentToClass(classId, studentDoc) {
  const _id = toObjectId(classId, "class id");
  let result;
  try {
    result = await col().updateOne(
      { _id, isActive: true, "students.studentId": { $ne: studentDoc.studentId } },
      { $push: { students: studentDoc } },
    );
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError("Student already exists in an active class", 409);
    }
    throw err;
  }
  if (result.matchedCount === 0) {
    const exists = await col().findOne({ _id, isActive: true }, { projection: { _id: 1 } });
    if (!exists) throw new AppError("Class not found", 404);
    throw new AppError("Student already exists in an active class", 409);
  }
}

/** Flattens students of all active classes (no grades / attendance). */
export async function listAllStudentsFlattened() {
  return col()
    .aggregate([
      { $match: { isActive: true } },
      { $unwind: "$students" },
      {
        $project: {
          _id: 0,
          id: "$students.id",
          studentId: "$students.studentId",
          firstName: "$students.firstName",
          lastName: "$students.lastName",
          academicRiskIndex: "$students.academicRiskIndex",
          classId: { $toString: "$_id" },
          className: "$className",
        },
      },
    ])
    .toArray();
}

/**
 * Hard delete ($pull).
 * @returns {Promise<object>} the removed student
 * @throws {AppError} 404 if class or student not found
 */
export async function removeStudent(classId, studentUuid) {
  const _id = toObjectId(classId, "class id");
  const before = await col().findOneAndUpdate(
    { _id, "students.id": studentUuid },
    { $pull: { students: { id: studentUuid } } },
    { returnDocument: "before", projection: { students: { $elemMatch: { id: studentUuid } } } },
  );
  const student = before?.students?.[0];
  if (student) return student;

  const classExists = await col().findOne({ _id }, { projection: { _id: 1 } });
  throw new AppError(classExists ? "Student not found" : "Class not found", 404);
}

/** @param {string} studentUuid @param {number} value */
export async function setRiskIndex(studentUuid, value) {
  await col().updateOne(
    { "students.id": studentUuid },
    { $set: { "students.$[s].academicRiskIndex": value } },
    { arrayFilters: [{ "s.id": studentUuid }] },
  );
}