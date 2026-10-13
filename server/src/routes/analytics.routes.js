import { Router } from "express";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { validate } from "../middleware/validate.js";
import { analyticsQuerySchema } from "../validators/analytics.validator.js";
import {
  getMyChild,
  getMyClass,
  getSchool,
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/my-child", authorizeRole("parent"), validate(analyticsQuerySchema), getMyChild);
router.get("/my-class", authorizeRole("teacher"), validate(analyticsQuerySchema), getMyClass);
router.get("/school", authorizeRole("admin"), validate(analyticsQuerySchema), getSchool);

export default router;