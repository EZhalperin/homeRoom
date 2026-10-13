import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";
import { logger } from "../utils/logger.js";

export const login = asyncHandler(async (req, res) => {
  const { userId, password } = req.validated.body;
  res.json(await authService.login(userId, password));
});

export const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    id: req.user.id,
    userId: req.user.userId,
    email: req.user.email,
    role: req.user.role,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    isActive: req.user.isActive,
    passwordSet: req.user.passwordSet,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  // Intentional non-awaited promise with explicit .catch(logger.error):
  // Dispatches email in the background to ensure constant response time and prevent user enumeration.
  authService.requestPasswordReset(email).catch((err) => {
    logger.error("Failed to process background password reset request:", err);
  });

  res.status(200).json({
    message: "אם הכתובת קיימת במערכת, נשלח אליה קישור לאיפוס סיסמה",
  });
});

export const validateToken = asyncHandler(async (req, res) => {
  const { token } = req.validated.params;
  const result = await authService.validatePasswordToken(token);
  res.json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.validated.body;
  const result = await authService.resetPassword(token, password);
  res.json(result);
});