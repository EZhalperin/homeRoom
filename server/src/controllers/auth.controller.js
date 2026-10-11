import { asyncHandler } from "../utils/asyncHandler.js";
import { login as loginUser } from "../services/authService.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

async function loginHandler(req, res) {
  const result = await loginUser(req.body.userId, req.body.password);
  res.json(result);
}

/**
 * Rate limiter is composed here because existing `auth.routes.js` does not mount it.
 */
export function login(req, res, next) {
  loginLimiter(req, res, (err) => {
    if (err) {
      return next(err);
    }
    return asyncHandler(loginHandler)(req, res, next);
  });
}

export const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({
    userId: req.user.userId,
    role: req.user.role,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
  });
});
