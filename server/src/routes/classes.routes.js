import { Router } from "express";
import { verifyToken } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { validate } from "../middleware/validate.js";
import {
  createClassSchema,
  listClassesSchema,
  classIdParamSchema,
} from "../validators/classes.validator.js";
import {
  createClass,
  listClasses,
  getMyClass,
  deleteClass,
} from "../controllers/classes.controller.js";

const router = Router();

router.post(
  "/admin/classes",
  verifyToken,
  authorizeRole("admin"),
  validate(createClassSchema),
  createClass,
);

router.get(
  "/staff/classes",
  verifyToken,
  authorizeRole("admin", "teacher"),
  validate(listClassesSchema),
  listClasses,
);

router.get("/teachers/my-class", verifyToken, authorizeRole("teacher"), getMyClass);

router.delete(
  "/admin/classes/:id",
  verifyToken,
  authorizeRole("admin"),
  validate(classIdParamSchema),
  deleteClass,
);

export default router;
