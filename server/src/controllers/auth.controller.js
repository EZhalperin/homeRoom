import { asyncHandler } from "../utils/asyncHandler.js";
import { login as loginUser } from "../services/authService.js";

export const login = asyncHandler(async (req, res) => {
  const { userId, password } = req.validated.body;
  res.json(await loginUser(userId, password));
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
  });
});
