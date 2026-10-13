import { Router } from "express";
import {
  login,
  logout,
  getMe,
  forgotPassword,
  validateToken,
  resetPassword,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/authenticate.js";
import {
  loginLimiter,
  forgotPasswordLimiter,
  passwordTokenLimiter,
  resetPasswordLimiter,
} from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  loginSchema,
  forgotPasswordSchema,
  passwordTokenParamSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/logout", verifyToken, logout);
router.get("/me", verifyToken, getMe);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);

router.get(
  "/password-token/:token",
  passwordTokenLimiter,
  validate(passwordTokenParamSchema),
  validateToken,
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);

export default router;