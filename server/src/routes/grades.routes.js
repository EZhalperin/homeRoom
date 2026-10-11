import { Router } from "express";
import { verifyToken } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { teacherOwnsStudent } from "../middleware/ownership.js";
import { validate } from "../middleware/validate.js";
import { createGradeSchema, updateGradeSchema } from "../validators/grades.validator.js";
import { addGrade, updateGrade } from "../controllers/grades.controller.js";

const router = Router();

router.post(
  "/teachers/students/:id/grades",
  verifyToken,
  authorizeRole("teacher"),
  validate(createGradeSchema),
  teacherOwnsStudent,
  addGrade,
);

router.put(
  "/teachers/students/:id/grades",
  verifyToken,
  authorizeRole("teacher"),
  validate(updateGradeSchema),
  teacherOwnsStudent,
  updateGrade,
);

export default router;
