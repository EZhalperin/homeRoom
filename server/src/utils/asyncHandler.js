/**
 * Wraps an async Express handler so rejected promises reach `next(err)`.
 * @param {(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => unknown} fn
 * @returns {import("express").RequestHandler}
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
