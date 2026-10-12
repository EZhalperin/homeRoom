import { Router } from "express";
import { updateMe } from "../controllers/users.controller.js";
import { verifyToken } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { updateMeSchema } from "../validators/users.validator.js";

const router = Router();

router.patch("/me", verifyToken, validate(updateMeSchema), updateMe);

export default router;
