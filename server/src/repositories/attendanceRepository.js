import { getCollection } from "../config/mongo.js";
import { COLLECTION } from "../models/Class.js";
import { AppError } from "../utils/AppError.js";
import { findStudentByUuid } from "./studentRepository.js";

const col = () => getCollection(COLLECTION);
const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC calendar-day key, e.g. "2025-01-31". */
function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

/**
 * Atomic insert; rejects the same calendar day (UTC) + type for that student.
 * @param {string} studentUuid
 * @param {import("../models/Class.js").Attendance} record
 */
export async function addAttendance(studentUuid, record) {
  const d = new Date(record.date);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const end = new Date(start.getTime() + DAY_MS);

  const result = await col().updateOne(
    {
      students: {
        $elemMatch: {
          id: studentUuid,
          attendance: {
            $not: { $elemMatch: { type: record.type, date: { $gte: start, $lt: end } } },
          },
        },
      },
    },
    { $push: { "students.$[s].attendance": record } },
    { arrayFilters: [{ "s.id": studentUuid }] },
  );

  if (result.matchedCount === 0) {
    const exists = await findStudentByUuid(studentUuid);
    if (!exists) throw new AppError("Student not found", 404);
    throw new AppError("Attendance record already exists", 409);
  }
}

/** Changes the type of the record matched by calendar day. */
export async function updateAttendanceByDate(studentUuid, { date, type }) {
  const found = await findStudentByUuid(studentUuid);
  if (!found) throw new AppError("Student not found", 404);

  const key = dayKey(date);
  const matches = (found.student.attendance || []).filter((r) => dayKey(r.date) === key);
  if (matches.length === 0) throw new AppError("Attendance record not found", 404);
  if (matches.length > 1) throw new AppError("Multiple attendance records match this date", 409);

  const result = await col().updateOne(
    { "students.id": studentUuid },
    { $set: { "students.$[s].attendance.$[a].type": type } },
    { arrayFilters: [{ "s.id": studentUuid }, { "a.date": new Date(matches[0].date) }] },
  );
  if (result.matchedCount === 0) throw new AppError("Attendance record not found", 404);
}