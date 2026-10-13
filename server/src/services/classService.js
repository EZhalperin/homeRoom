import * as classRepository from "../repositories/classRepository.js";
import * as userRepository from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { findByUserId } from "./authService.js";

/**
 * Class business logic. No Express objects.
 * @module services/classService
 */

export async function createClass({ teacherId, className }) {
  const teacher = await findByUserId(teacherId);
  if (!teacher || teacher.role !== "teacher" || teacher.isActive === false) {
    throw new AppError("Teacher not found or inactive", 400);
  }
  const existing = await classRepository.findActiveByTeacherId(teacherId);
  if (existing) throw new AppError("Teacher already has an active class", 409);

  await classRepository.create({ teacherId, className });
  return { teacherId, className };
}

/**
 * A teacher is ALWAYS scoped to their own classes; any client teacherId is ignored.
 * Batches lookup for teacherName across all returned classes.
 * @param {{ userId: string, role: string }} requestingUser
 * @param {{ className?: string, isActive?: boolean }} filters
 */
export async function listClasses(requestingUser, filters = {}) {
  const classes = await classRepository.list({
    className: filters.className,
    isActive: filters.isActive,
    teacherId:
      requestingUser.role === "teacher" ? requestingUser.userId : filters.teacherId,
  });

  const teacherIds = Array.from(new Set(classes.map((c) => c.teacherId).filter(Boolean)));
  const teachers = await userRepository.findManyByUserIds(teacherIds);
  const teacherMap = new Map(
    teachers.map((t) => [t.userId, `${t.firstName || ""} ${t.lastName || ""}`.trim()]),
  );

  return classes.map((c) => ({
    ...c,
    teacherName: teacherMap.get(c.teacherId) || null,
    studentsCount: Array.isArray(c.students) ? c.students.length : 0,
  }));
}

export async function getMyClass(teacherUserId) {
  const cls = await classRepository.findActiveByTeacherId(teacherUserId);
  if (!cls) throw new AppError("Class not found", 404);
  return { className: cls.className, students: cls.students };
}

export async function deleteClass(classId) {
  const cls = await classRepository.softDelete(classId);
  if (!cls) throw new AppError("Class not found", 404);
  return { id: String(cls._id), className: cls.className };
}