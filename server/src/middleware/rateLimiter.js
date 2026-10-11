import rateLimit from "express-rate-limit";

/**
 * Brute-force protection for `POST /api/auth/login`.
 * 10 requests per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});
