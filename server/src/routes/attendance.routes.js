import { Router } from "express";
import { verifyToken } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { teacherOwnsStudent } from "../middleware/ownership.js";
import { validate } from "../middleware/validate.js";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from "../validators/attendance.validator.js";
import { addAttendance, updateAttendance } from "../controllers/attendance.controller.js";

const router = Router();

router.post(
  "/teachers/students/:id/attendance",
  verifyToken,
  authorizeRole("teacher"),
  validate(createAttendanceSchema),
  teacherOwnsStudent,
  addAttendance,
);

router.put(
  "/teachers/students/:id/attendance",
  verifyToken,
  authorizeRole("teacher"),
  validate(updateAttendanceSchema),
  teacherOwnsStudent,
  updateAttendance,
);

export default router;
