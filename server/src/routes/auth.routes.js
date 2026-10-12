import { Router } from "express";
import { login, logout, getMe } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/authenticate.js";
import { loginLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/logout", verifyToken, logout);
router.get("/me", verifyToken, getMe);

export default router;
