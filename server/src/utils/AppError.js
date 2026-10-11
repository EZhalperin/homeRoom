/**
 * Operational HTTP error. The global error handler serializes `message` only.
 */
export class AppError extends Error {
  /**
   * @param {string} message Human-readable error shown to the client.
   * @param {number} [statusCode=500]
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
