import { registerUserSchema, updateUserSchema, getUsersSchema, updateMeSchema, userIdParamSchema } from "../src/validators/users.validator.js";
import { listClassesSchema } from "../src/validators/classes.validator.js";

describe("user validators", () => {
  test("register requires a normalized email", () => {
    const result = registerUserSchema.safeParse({
      body: {
        userId: "123",
        email: "  Admin@School.Local ",
        password: "password1",
        role: "admin",
        firstName: "A",
        lastName: "B",
      },
    });
    expect(result.success).toBe(true);
    expect(result.data.body.email).toBe("admin@school.local");
  });

  test("register rejects invalid email", () => {
    const result = registerUserSchema.safeParse({
      body: {
        userId: "123",
        email: "not-an-email",
        password: "password1",
        role: "admin",
        firstName: "A",
        lastName: "B",
      },
    });
    expect(result.success).toBe(false);
  });

  test("update user params require a uuid", () => {
    const bad = updateUserSchema.safeParse({ params: { id: "12" }, body: { firstName: "A" } });
    expect(bad.success).toBe(false);
    const good = updateUserSchema.safeParse({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
      body: { email: "x@y.com", isActive: true },
    });
    expect(good.success).toBe(true);
    expect(good.data.body.email).toBe("x@y.com");
    expect(good.data.body.isActive).toBe(true);
  });

  test("userIdParamSchema rejects numeric ids", () => {
    expect(userIdParamSchema.safeParse({ params: { id: "42" } }).success).toBe(false);
  });

  test("query isActive stays a boolean, including false", () => {
    const result = getUsersSchema.safeParse({ query: { isActive: "false" } });
    expect(result.success).toBe(true);
    expect(result.data.query.isActive).toBe(false);

    const classes = listClassesSchema.safeParse({ query: { isActive: "true" } });
    expect(classes.success).toBe(true);
    expect(classes.data.query.isActive).toBe(true);
  });

  test("updateMe accepts optional email", () => {
    const result = updateMeSchema.safeParse({ body: { email: " Me@X.COM " } });
    expect(result.success).toBe(true);
    expect(result.data.body.email).toBe("me@x.com");
  });
});
