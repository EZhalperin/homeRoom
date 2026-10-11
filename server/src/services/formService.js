import * as classRepository from "../repositories/classRepository.js";
import * as formRepository from "../repositories/formRepository.js";
import { buildFormDoc } from "../models/Class.js";
import { AppError } from "../utils/AppError.js";
import { resolveParentStudent } from "./studentService.js";

/** @module services/formService */

async function teacherActiveClass(teacherUserId) {
  const cls = await classRepository.findActiveByTeacherId(teacherUserId);
  if (!cls) throw new AppError("Class not found", 404);
  return cls;
}

/** Distributes a form to every student of the teacher's active class. */
export async function createForm({ teacherUserId, title, description, deadline }) {
  const cls = await teacherActiveClass(teacherUserId);
  await formRepository.distributeForm(cls._id, buildFormDoc({ title, description, deadline }));
  return { teacherId: teacherUserId, title, description, deadline };
}

export async function updateForm({ teacherUserId, title, deadline, description, newDeadline }) {
  const cls = await teacherActiveClass(teacherUserId);
  return formRepository.updateForm(cls._id, { title, deadline, description, newDeadline });
}

/** A parent approves a form for their own child only; not after the deadline. */
export async function approveForm({ parentUserId, studentUuid, title }) {
  const { student } = await resolveParentStudent(parentUserId, studentUuid);
  const form = (student.forms || []).find((f) => f.title === title);
  if (!form) throw new AppError("Form not found", 404);
  if (new Date(form.deadline) < new Date()) throw new AppError("Form deadline has passed", 409);

  await formRepository.setFormApproved(studentUuid, title);
  return { title: form.title, description: form.description, deadline: form.deadline, isApproved: true };
}