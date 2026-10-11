import { asyncHandler } from "../utils/asyncHandler.js";
import * as attendanceService from "../services/attendanceService.js";

export const addAttendance = asyncHandler(async (req, res) => {
  const { date, type } = req.body;
  const result = await attendanceService.addAttendance({
    teacherUserId: req.user.userId,
    studentUuid: req.params.id,
    date,
    type,
  });
  res.status(201).json({ message: "Attendance recorded successfully", ...result });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const { date, type } = req.body;
  const result = await attendanceService.updateAttendance({
    teacherUserId: req.user.userId,
    studentUuid: req.params.id,
    date,
    type,
  });
  res.json({ message: "Attendance updated successfully", ...result });
});