import { asyncHandler } from "../utils/asyncHandler.js";
import * as gradeRecordService from "../services/gradeRecordService.js";

export const addGrade = asyncHandler(async (req, res) => {
  const { subject, taskName, score, weight, date } = req.validated.body;
  const result = await gradeRecordService.addGrade({
    teacherUserId: req.user.userId,
    studentUuid: req.validated.params.id,
    subject,
    taskName,
    score,
    weight,
    date,
  });
  res.status(201).json({ message: "Grade added successfully", ...result });
});

export const updateGrade = asyncHandler(async (req, res) => {
  const { score, subject, date, taskName } = req.validated.body;
  const result = await gradeRecordService.updateGrade({
    teacherUserId: req.user.userId,
    studentUuid: req.validated.params.id,
    score,
    subject,
    date,
    taskName,
  });
  res.json({ message: "Grade updated successfully", ...result });
});
