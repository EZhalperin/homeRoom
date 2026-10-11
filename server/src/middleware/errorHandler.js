import { logger } from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";

/**
 * Express 404 fallback. Mount after all routes.
 * @type {import("express").RequestHandler}
 */
export function notFoundHandler(req, res, next) {
  next(new AppError("Route not found", 404));
}

/**
 * Central error serializer. Always `{ message }` — never stack or internals.
 * @type {import("express").ErrorRequestHandler}
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ZodError" && Array.isArray(err.issues)) {
    statusCode = 400;
    message = err.issues[0]?.message || "Validation error";
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication required";
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid identifier";
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File too large (max 5MB)";
  }

  if (statusCode >= 500) {
    logger.error(err);
    if (process.env.NODE_ENV === "production") {
      message = "Internal server error";
    }
  }

  res.status(statusCode).json({ message });
}

/**
 * Logs process-level crashes. Call once at process startup.
 */
export function registerProcessHandlers() {
  process.on("unhandledRejection", (reason) => {
    logger.error("unhandledRejection", reason);
  });

  process.on("uncaughtException", (err) => {
    logger.error("uncaughtException", err);
    process.exit(1);
  });
}
