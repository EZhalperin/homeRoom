import { AppError } from "../utils/AppError.js";

/**
 * Zod validation middleware.
 * Schemas should be `z.object({ body?, query?, params? })`.
 *
 * @param {import("zod").ZodTypeAny} schema
 * @returns {import("express").RequestHandler}
 */
export function validate(schema) {
  return (req, res, next) => {
    const parser = typeof schema.passthrough === "function" ? schema.passthrough() : schema;
    const result = parser.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.issues?.[0]?.message || "Validation error";
      return next(new AppError(message, 400));
    }

    if (result.data.body !== undefined) {
      req.body = result.data.body;
    }
    if (result.data.query !== undefined) {
      try {
        req.query = result.data.query;
      } catch {
        Object.assign(req.query, result.data.query);
      }
    }
    if (result.data.params !== undefined) {
      Object.assign(req.params, result.data.params);
    }

    next();
  };
}
