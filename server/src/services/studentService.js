import * as classRepository from "../repositories/classRepository.js";
import * as studentRepository from "../repositories/studentRepository.js";
import * as notificationService from "./notificationService.js";
import * as userRepository from "../repositories/userRepository.js";
import { buildStudentDoc } from "../models/Class.js";
import { AppError } from "../utils/AppError.js";
import { weightedAverage } from "./gradeService.js";
import { calculate, calculateBreakdown } from "./riskIndexService.js";
import { RISK_CONFIG } from "../config/risk.config.js";

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
  const { student, className, teacherId } = found;

  let teacher = null;
  if (teacherId) {
    const teachers = await userRepository.findManyByUserIds([teacherId]);
    if (teachers && teachers.length > 0) {
      teacher = {
        firstName: teachers[0].firstName || "",
        lastName: teachers[0].lastName || "",
      };
    }
  }

  return {
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    className: className || null,
    teacher,
    grades: student.grades || [],
    forms: student.forms || [],
    attendance: student.attendance || [],
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
 * Notifies the teacher when crossing WARNING_THRESHOLD or ALERT_THRESHOLD upward.
 * @param {string} studentUuid
 * @returns {Promise<number>}
 */
export async function recomputeForStudent(studentUuid) {
  const found = await studentRepository.findStudentByUuid(studentUuid);
  if (!found) throw new AppError("Student not found", 404);

  const oldIndex = found.student.academicRiskIndex ?? 0;
  const index = calculate(found.student, new Date());
  await studentRepository.setRiskIndex(studentUuid, index);

  // Trigger: only on crossing WARNING_THRESHOLD or ALERT_THRESHOLD upward
  const crossedAlert = oldIndex < RISK_CONFIG.ALERT_THRESHOLD && index >= RISK_CONFIG.ALERT_THRESHOLD;
  const crossedWarning = oldIndex < RISK_CONFIG.WARNING_THRESHOLD && index >= RISK_CONFIG.WARNING_THRESHOLD;

  if ((crossedAlert || crossedWarning) && found.teacherId) {
    const isAlert = index >= RISK_CONFIG.ALERT_THRESHOLD;
    const title = isAlert ? "התראת סיכון אקדמי גבוה" : "אזהרת סיכון אקדמי";
    const body = `${found.student.firstName} ${found.student.lastName}: מדד הסיכון עלה ל-${index.toFixed(1)}`;
    await notificationService.createMany([found.teacherId], {
      type: "risk",
      title,
      body,
      link: "/teacher/risk",
      data: {
        studentUuid,
        studentName: `${found.student.firstName} ${found.student.lastName}`,
        oldIndex,
        newIndex: index,
        threshold: isAlert ? "alert" : "warning",
      },
    });
  }

  return index;
}
export async function getStudentRiskBreakdown(teacherUserId, studentUuid) {
  const found = await resolveTeacherStudent(teacherUserId, studentUuid);
  return calculateBreakdown(found.student, new Date(), RISK_CONFIG);
}