import { getCollection } from "../config/mongo.js";
import { COLLECTION } from "../models/Class.js";
import { AppError } from "../utils/AppError.js";
import { toObjectId } from "../utils/mongoHelpers.js";

const col = () => getCollection(COLLECTION);

/**
 * Pushes the form into EVERY student of the class ($[] all-positional).
 * Atomically rejects a form with the same title + deadline.
 * @param {string} classId
 * @param {import("../models/Class.js").Form} formDoc
 */
export async function distributeForm(classId, formDoc) {
  const _id = toObjectId(classId, "class id");
  const result = await col().updateOne(
    {
      _id,
      isActive: true,
      students: {
        $not: {
          $elemMatch: {
            forms: { $elemMatch: { title: formDoc.title, deadline: formDoc.deadline } },
          },
        },
      },
    },
    { $push: { "students.$[].forms": formDoc } },
  );
  if (result.matchedCount === 0) {
    const exists = await col().findOne({ _id, isActive: true }, { projection: { _id: 1 } });
    if (!exists) throw new AppError("Class not found", 404);
    throw new AppError("A form with this title and deadline already exists", 409);
  }
}

/**
 * Updates description and/or deadline of the form matched by title + deadline,
 * across all students of the class. isApproved is untouched.
 * @returns {Promise<{ description: string, deadline: Date|string }>}
 */
export async function updateForm(classId, { title, deadline, description, newDeadline }) {
  const _id = toObjectId(classId, "class id");
  const when = new Date(deadline);

  const cls = await col().findOne({ _id, isActive: true }, { projection: { "students.forms": 1 } });
  const existing = (cls?.students || [])
    .flatMap((s) => s.forms || [])
    .find((f) => f.title === title && new Date(f.deadline).getTime() === when.getTime());
  if (!existing) throw new AppError("Form not found", 404);

  const $set = {};
  if (description !== undefined) $set["students.$[].forms.$[f].description"] = description;
  if (newDeadline !== undefined) $set["students.$[].forms.$[f].deadline"] = new Date(newDeadline);

  if (Object.keys($set).length > 0) {
    await col().updateOne(
      { _id },
      { $set },
      { arrayFilters: [{ "f.title": title, "f.deadline": when }] },
    );
  }

  return {
    description: description !== undefined ? description : existing.description,
    deadline: newDeadline !== undefined ? newDeadline : deadline,
  };
}

/** Marks the student's form(s) with this title as approved. */
export async function setFormApproved(studentUuid, title) {
  const result = await col().updateOne(
    { "students.id": studentUuid },
    { $set: { "students.$[s].forms.$[f].isApproved": true } },
    { arrayFilters: [{ "s.id": studentUuid }, { "f.title": title }] },
  );
  if (result.matchedCount === 0) throw new AppError("Form not found", 404);
}