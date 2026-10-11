import { getCollection } from "../config/mongo.js";
import { COLLECTION } from "../models/Class.js";
import { AppError } from "../utils/AppError.js";
import { findStudentByUuid } from "./studentRepository.js";

const col = () => getCollection(COLLECTION);

/**
 * Atomic $push of a grade into one student.
 * @param {string} studentUuid
 * @param {import("../models/Class.js").Grade} gradeDoc
 */
export async function addGrade(studentUuid, gradeDoc) {
  const result = await col().updateOne(
    { "students.id": studentUuid },
    { $push: { "students.$[s].grades": gradeDoc } },
    { arrayFilters: [{ "s.id": studentUuid }] },
  );
  if (result.matchedCount === 0) throw new AppError("Student not found", 404);
}

/**
 * Updates the score of the grade matched by subject + date (+ optional taskName).
 * 404 when nothing matches, 409 when more than one matches.
 */
export async function updateGrade(studentUuid, { subject, date, taskName, score }) {
  const found = await findStudentByUuid(studentUuid);
  if (!found) throw new AppError("Student not found", 404);

  const when = new Date(date).getTime();
  const matches = (found.student.grades || []).filter(
    (g) =>
      g.subject === subject &&
      new Date(g.date).getTime() === when &&
      (!taskName || g.taskName === taskName),
  );
  if (matches.length === 0) throw new AppError("Grade not found", 404);
  if (matches.length > 1) throw new AppError("Multiple grades match; provide taskName", 409);

  const gradeFilter = { "g.subject": subject, "g.date": new Date(date) };
  if (taskName) gradeFilter["g.taskName"] = taskName;

  const result = await col().updateOne(
    { "students.id": studentUuid },
    { $set: { "students.$[s].grades.$[g].score": Number(score) } },
    { arrayFilters: [{ "s.id": studentUuid }, gradeFilter] },
  );
  if (result.matchedCount === 0) throw new AppError("Grade not found", 404);
}