import { Router } from "express";
import { verifyToken } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { parentOwnsStudent } from "../middleware/ownership.js";
import { validate } from "../middleware/validate.js";
import {
  createFormSchema,
  updateFormSchema,
  approveFormSchema,
} from "../validators/forms.validator.js";
import { distributeForm, updateForm, approveForm } from "../controllers/forms.controller.js";

const router = Router();

router.post(
  "/teachers/forms",
  verifyToken,
  authorizeRole("teacher"),
  validate(createFormSchema),
  distributeForm,
);

router.put(
  "/teachers/forms",
  verifyToken,
  authorizeRole("teacher"),
  validate(updateFormSchema),
  updateForm,
);

router.patch(
  "/parents/students/:id/forms/:title/approve",
  verifyToken,
  authorizeRole("parent"),
  validate(approveFormSchema),
  parentOwnsStudent,
  approveForm,
);

export default router;
