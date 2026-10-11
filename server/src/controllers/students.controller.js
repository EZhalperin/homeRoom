import { asyncHandler } from "../utils/asyncHandler.js";
import * as studentService from "../services/studentService.js";

export const addStudent = asyncHandler(async (req, res) => {
  const { studentId, firstName, lastName } = req.body;
  const result = await studentService.addStudent({
    classId: req.params.id,
    studentId,
    firstName,
    lastName,
  });
  res.status(201).json({ message: "Student added successfully", ...result });
});

export const listAllStudents = asyncHandler(async (req, res) => {
  res.json(await studentService.listAllStudents());
});

export const listClassStudents = asyncHandler(async (req, res) => {
  res.json(await studentService.listStudentsOfClass(req.user.userId, req.params.id));
});

export const getMyChild = asyncHandler(async (req, res) => {
  res.json(await studentService.getMyChild(req.user.userId));
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const result = await studentService.removeStudent({
    classId: req.params.classId,
    studentUuid: req.params.id,
  });
  res.json({ message: "Student removed successfully", ...result });
});