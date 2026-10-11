import { asyncHandler } from "../utils/asyncHandler.js";
import {
  assertTeacherOwnsClass,
  resolveParentStudent,
  resolveTeacherStudent,
} from "../services/studentService.js";

/**
 * Thin wrappers around the ownership rules in studentService.
 * They set req.ownedClass / req.ownedStudent (plain objects).
 * Services re-check ownership themselves (defense in depth).
 */

/** Class `:id` must belong to the authenticated teacher. */
export const teacherOwnsClass = asyncHandler(async (req, res, next) => {
  req.ownedClass = await assertTeacherOwnsClass(req.user.userId, req.params.id);
  next();
});

/** Student `:id` (uuid) must be in the teacher's ACTIVE class. */
export const teacherOwnsStudent = asyncHandler(async (req, res, next) => {
  const found = await resolveTeacherStudent(req.user.userId, req.params.id);
  req.ownedClass = { _id: found.classId, className: found.className, teacherId: found.teacherId };
  req.ownedStudent = found.student;
  next();
});

/** Student `:id` (uuid) must have studentId equal to the parent's login userId. */
export const parentOwnsStudent = asyncHandler(async (req, res, next) => {
  const found = await resolveParentStudent(req.user.userId, req.params.id);
  req.ownedClass = { _id: found.classId, className: found.className, teacherId: found.teacherId };
  req.ownedStudent = found.student;
  next();
});