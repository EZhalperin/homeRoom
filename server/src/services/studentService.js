import * as classRepository from "../repositories/classRepository.js";
import * as studentRepository from "../repositories/studentRepository.js";
import { buildStudentDoc } from "../models/Class.js";
import { AppError } from "../utils/AppError.js";
import { weightedAverage } from "./gradeService.js";
import { calculate } from "./riskIndexService.js";

/**
 * Student / class business logic. No Express objects.
 * @module services/studentService
 */

/**
 * Ownership: the class must belong to this teacher.
 * @throws {AppError} 404 / 403
 */
export async function assertTeacherOwnsClass(teacherUserId, classId) {
  const cls = await classRepository.findById(classId);
  if (!cls) throw new AppError("Class not found", 404);
  if (cls.teacherId !== teacherUserId) throw new AppError("Forbidden", 403);
  return cls;
}

/**
 * Ownership: the student (uuid) must be in this teacher's ACTIVE class.
 * @returns {Promise<{classId:string, className:string, teacherId:string, student:object}>}
 */
export async function resolveTeacherStudent(teacherUserId, studentUuid) {
  const found = await studentRepository.findStudentByUuid(studentUuid, {
    activeOnly: true,
    teacherId: teacherUserId,
  });
  if (!found) throw new AppError("Student not found", 404);
  return found;
}

/**
 * Ownership: the student's national ID must equal the parent's login userId.
 */
export async function resolveParentStudent(parentUserId, studentUuid) {
  const found = await studentRepository.findStudentByUuid(studentUuid, {
    activeOnly: true,
  });
  if (!found) throw new AppError("Student not found", 404);
  if (found.student.studentId !== parentUserId)
    throw new AppError("Forbidden", 403);
  return found;
}

export async function addStudent({ classId, studentId, firstName, lastName }) {
  const doc = buildStudentDoc({ studentId, firstName, lastName });
  await studentRepository.addStudentToClass(classId, doc);
  return { studentId, firstName, lastName };
}

export function listAllStudents() {
  return studentRepository.listAllStudentsFlattened();
}

export async function listStudentsOfClass(teacherUserId, classId) {
  const cls = await assertTeacherOwnsClass(teacherUserId, classId);
  return cls.students || [];
}

export async function getMyChild(parentUserId) {
  const found =
    await studentRepository.findActiveStudentByStudentId(parentUserId);
  if (!found) throw new AppError("Student not found", 404);
  const { student } = found;
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    grades: student.grades,
    forms: student.forms,
    attendance: student.attendance,
    id: student.id,
    weightedAverages: weightedAverage(student.grades),
  };
}

export async function removeStudent({ classId, studentUuid }) {
  const student = await studentRepository.removeStudent(classId, studentUuid);
  return {
    id: student.id,
    classId: String(classId),
    firstName: student.firstName,
    lastName: student.lastName,
  };
}

/**
 * Loads the student, computes the (pure) risk index and stores it.
 * @param {string} studentUuid
 * @returns {Promise<number>}
 */
export async function recomputeForStudent(studentUuid) {
  const found = await studentRepository.findStudentByUuid(studentUuid);
  if (!found) throw new AppError("Student not found", 404);
  const index = calculate(found.student, new Date());
  await studentRepository.setRiskIndex(studentUuid, index);
  return index;
}
