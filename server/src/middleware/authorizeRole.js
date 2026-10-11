import { AppError } from "../utils/AppError.js";

/**
 * Role gate. Identity always comes from `req.user` (set by authenticate).
 *
 * @param {...("admin"|"teacher"|"parent")} roles
 * @returns {import("express").RequestHandler}
 */
export function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}

/** Convenience middleware used by the existing `app.js`. */
export const isAdmin = authorizeRole("admin");
