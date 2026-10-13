import { Router } from "express";
import { verifyToken } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { teacherOwnsClass } from "../middleware/ownership.js";
import { validate } from "../middleware/validate.js";
import {
  addStudentSchema,
  classStudentsParamSchema,
  deleteStudentSchema,
  studentIdParamSchema,
} from "../validators/students.validator.js";
import {
  addStudent,
  listAllStudents,
  listClassStudents,
  getMyChild,
  deleteStudent,
  getStudentRisk,
} from "../controllers/students.controller.js";

const router = Router();

router.post(
  "/admin/classes/:id/students",
  verifyToken,
  authorizeRole("admin"),
  validate(addStudentSchema),
  addStudent,
);

router.get("/admin/students", verifyToken, authorizeRole("admin"), listAllStudents);

router.get(
  "/teachers/classes/:id/students",
  verifyToken,
  authorizeRole("teacher"),
  validate(classStudentsParamSchema),
  teacherOwnsClass,
  listClassStudents,
);

router.get(
  "/teachers/students/:id/risk",
  verifyToken,
  authorizeRole("teacher"),
  validate(studentIdParamSchema),
  getStudentRisk,
);

router.get("/parents/my-child", verifyToken, authorizeRole("parent"), getMyChild);

router.delete(
  "/admin/classes/:classId/students/:id",
  verifyToken,
  authorizeRole("admin"),
  validate(deleteStudentSchema),
  deleteStudent,
);

export default router;