import { validate } from "../src/middleware/validate.js";
import { getUsersSchema } from "../src/validators/users.validator.js";

function mockReq(query) {
  return { body: {}, query, params: {} };
}

describe("validate middleware", () => {
  test("writes typed query onto req.validated", () => {
    const mw = validate(getUsersSchema);
    const req = mockReq({ isActive: "false", role: "teacher" });
    const next = (err) => {
      expect(err).toBeUndefined();
    };
    mw(req, {}, next);
    expect(req.validated.query.isActive).toBe(false);
    expect(req.validated.query.role).toBe("teacher");
  });

  test("invalid uuid-like user filter still 400 via next(AppError)", () => {
    const mw = validate(getUsersSchema);
    const req = mockReq({ role: "nope" });
    let captured;
    mw(req, {}, (err) => {
      captured = err;
    });
    expect(captured.statusCode).toBe(400);
    expect(captured.message).toBeDefined();
  });
});
