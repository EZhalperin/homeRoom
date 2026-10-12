import { AppError } from "../src/utils/AppError.js";
import { throwIfSupabaseError } from "../src/repositories/userRepository.js";

describe("throwIfSupabaseError", () => {
  test("maps email unique violation to 409", () => {
    expect(() =>
      throwIfSupabaseError({
        code: "23505",
        message: 'duplicate key value violates unique constraint "users_email_key"',
        details: "Key (email)=(a@b.com) already exists.",
      }),
    ).toThrow(new AppError("Email already in use", 409));
  });

  test("maps userId unique violation to 409", () => {
    expect(() =>
      throwIfSupabaseError({
        code: "23505",
        message: 'duplicate key value violates unique constraint "users_userId_key"',
        details: 'Key (userId)=(123) already exists.',
      }),
    ).toThrow(new AppError("User already exists", 409));
  });

  test("maps missing row to 404 when requested", () => {
    expect(() =>
      throwIfSupabaseError({ code: "PGRST116" }),
    ).toThrow(new AppError("User not found", 404));
  });
});
