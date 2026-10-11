import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { findByUserId, toPublicUser, verifyToken as verifyJwt } from "../services/authService.js";

/**
 * Verifies `Authorization: Bearer <jwt>` and re-checks `isActive` in Supabase
 * so a suspended user is blocked immediately.
 *
 * Sets `req.user` to `{ id, userId, role, firstName, lastName, isActive }`.
 *
 * @type {import("express").RequestHandler}
 */
export const verifyToken = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError("Authentication required", 401);
  }

  const payload = verifyJwt(token);
  const user = await findByUserId(payload.userId);
  if (!user) {
    throw new AppError("Authentication required", 401);
  }
  if (user.isActive === false) {
    throw new AppError("Account is suspended", 403);
  }

  req.user = toPublicUser(user);
  next();
});

/** Spec name; existing routes import `verifyToken`. */
export const authenticate = verifyToken;
