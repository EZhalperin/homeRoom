import { Class } from "../models/Class.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @param {import("mongoose").Document} classDoc
 * @param {string} studentUuid
 */
function studentFromClass(classDoc, studentUuid) {
  return classDoc.students.find((student) => student.id === studentUuid);
}

/**
 * Class `:id` must belong to the authenticated teacher.
 * @type {import("express").RequestHandler}
 */
export const teacherOwnsClass = asyncHandler(async (req, res, next) => {
  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) {
    throw new AppError("Class not found", 404);
  }
  if (classDoc.teacherId !== req.user.userId) {
    throw new AppError("Forbidden", 403);
  }
  req.ownedClass = classDoc;
  next();
});

/**
 * Student `:id` (uuid) must be in the authenticated teacher's ACTIVE class.
 * @type {import("express").RequestHandler}
 */
export const teacherOwnsStudent = asyncHandler(async (req, res, next) => {
  const classDoc = await Class.findOne({
    isActive: true,
    teacherId: req.user.userId,
    "students.id": req.params.id,
  });
  if (!classDoc) {
    throw new AppError("Student not found", 404);
  }
  const student = studentFromClass(classDoc, req.params.id);
  if (!student) {
    throw new AppError("Student not found", 404);
  }
  req.ownedClass = classDoc;
  req.ownedStudent = student;
  next();
});

/**
 * Student `:id` (uuid) must have `studentId` equal to the parent's login userId.
 * @type {import("express").RequestHandler}
 */
export const parentOwnsStudent = asyncHandler(async (req, res, next) => {
  const classDoc = await Class.findOne({
    isActive: true,
    "students.id": req.params.id,
  });
  if (!classDoc) {
    throw new AppError("Student not found", 404);
  }
  const student = studentFromClass(classDoc, req.params.id);
  if (!student) {
    throw new AppError("Student not found", 404);
  }
  if (student.studentId !== req.user.userId) {
    throw new AppError("Forbidden", 403);
  }
  req.ownedClass = classDoc;
  req.ownedStudent = student;
  next();
});
