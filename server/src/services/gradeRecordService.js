import * as gradeRepository from "../repositories/gradeRepository.js";
import { buildGradeDoc } from "../models/Class.js";
import { recomputeForStudent, resolveTeacherStudent } from "./studentService.js";

/**
 * Grade CRUD (data). The pure math stays in gradeService.js.
 * @module services/gradeRecordService
 */

export async function addGrade({ teacherUserId, studentUuid, subject, taskName, score, weight, date }) {
  await resolveTeacherStudent(teacherUserId, studentUuid);
  await gradeRepository.addGrade(
    studentUuid,
    buildGradeDoc({ subject, taskName, score, weight, date }),
  );
  await recomputeForStudent(studentUuid);
  return { id: studentUuid, subject, taskName, score, weight, date };
}

export async function updateGrade({ teacherUserId, studentUuid, score, subject, date, taskName }) {
  await resolveTeacherStudent(teacherUserId, studentUuid);
  await gradeRepository.updateGrade(studentUuid, { subject, date, taskName, score });
  await recomputeForStudent(studentUuid);
  return { score, subject, date };
}