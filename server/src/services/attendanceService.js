import * as attendanceRepository from "../repositories/attendanceRepository.js";
import * as notificationService from "./notificationService.js";
import { buildAttendanceDoc } from "../models/Class.js";
import { recomputeForStudent, resolveTeacherStudent } from "./studentService.js";

/** @module services/attendanceService */

export async function addAttendance({ teacherUserId, studentUuid, date, type }) {
  const { student } = await resolveTeacherStudent(teacherUserId, studentUuid);
  await attendanceRepository.addAttendance(studentUuid, buildAttendanceDoc({ date, type }));
  await recomputeForStudent(studentUuid);

  // Trigger: notify that student's parent
  if (student.studentId) {
    const typeLabel = type === "absence" ? "חיסור" : "איחור";
    await notificationService.createMany([student.studentId], {
      type: "attendance",
      title: `דיווח נוכחות: ${typeLabel}`,
      body: `נרשם ${typeLabel} עבור ${student.firstName} ${student.lastName}`,
      link: "/parent",
      data: { studentUuid, date, type },
    });
  }

  return { studentId: student.studentId, date, type };
}

export async function updateAttendance({ teacherUserId, studentUuid, date, type }) {
  await resolveTeacherStudent(teacherUserId, studentUuid);
  await attendanceRepository.updateAttendanceByDate(studentUuid, { date, type });
  await recomputeForStudent(studentUuid);
  return { type, date };
}