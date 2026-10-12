import { AppError } from "../utils/AppError.js";

/**
 * Zod validation middleware.
 * Schemas should be `z.object({ body?, query?, params? })`.
 *
 * Parsed values live on `req.validated`. `req.body` / `req.params` are also
 * overwritten with parsed values. Express 5 exposes `req.query` as a getter,
 * so typed query values are only reliable via `req.validated.query`.
 *
 * @param {import("zod").ZodTypeAny} schema
 * @returns {import("express").RequestHandler}
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.issues?.[0]?.message || "Validation error";
      return next(new AppError(message, 400));
    }

    const body = result.data.body ?? req.body;
    const query = result.data.query ?? req.query;
    const params = result.data.params ?? req.params;

    req.validated = { body, query, params };

    if (result.data.body !== undefined) {
      req.body = result.data.body;
    }
    if (result.data.params !== undefined) {
      Object.assign(req.params, result.data.params);
    }

    next();
  };
}
