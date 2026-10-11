import { randomUUID } from "node:crypto";

/**
 * Document shapes for the `classes` collection (native driver, no schemas).
 * Validation lives in the Zod validators.
 * @module models/Class
 */

export const COLLECTION = "classes";
export const ATTENDANCE_TYPES = Object.freeze(["absence", "late"]);

/**
 * @typedef {Object} Grade
 * @property {string} subject
 * @property {string} taskName
 * @property {number} score        0..100
 * @property {number} weight       0.0..1.0
 * @property {Date} date
 *
 * @typedef {Object} Attendance
 * @property {Date} date
 * @property {"absence"|"late"} type
 *
 * @typedef {Object} Form
 * @property {string} title
 * @property {string} description
 * @property {Date} deadline
 * @property {boolean} isApproved
 *
 * @typedef {Object} Student
 * @property {string} id           uuid
 * @property {string} studentId    national ID
 * @property {string} firstName
 * @property {string} lastName
 * @property {number} academicRiskIndex  0..10
 * @property {Grade[]} grades
 * @property {Attendance[]} attendance
 * @property {Form[]} forms
 *
 * @typedef {Object} ClassDoc
 * @property {import("mongodb").ObjectId} [_id]
 * @property {string} teacherId
 * @property {string} className
 * @property {Student[]} students
 * @property {boolean} isActive
 */

/** @returns {ClassDoc} */
export function buildClassDoc({ teacherId, className }) {
  return { teacherId, className, students: [], isActive: true };
}

/** @returns {Student} */
export function buildStudentDoc({ studentId, firstName, lastName }) {
  return {
    id: randomUUID(),
    studentId,
    firstName,
    lastName,
    academicRiskIndex: 0,
    grades: [],
    attendance: [],
    forms: [],
  };
}

/** @returns {Grade} */
export function buildGradeDoc({ subject, taskName, score, weight, date }) {
  return {
    subject,
    taskName,
    score: Number(score),
    weight: Number(weight),
    date: new Date(date),
  };
}

/** @returns {Attendance} */
export function buildAttendanceDoc({ date, type }) {
  return { date: new Date(date), type };
}

/** @returns {Form} */
export function buildFormDoc({ title, description, deadline }) {
  return { title, description, deadline: new Date(deadline), isApproved: false };
}