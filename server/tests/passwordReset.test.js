import crypto from "node:crypto";
import { jest } from "@jest/globals";
import { passwordSchema } from "../src/validators/common.js";
import { registerUserSchema, updateMeSchema } from "../src/validators/users.validator.js";
import { resetPasswordSchema } from "../src/validators/auth.validator.js";
import { AppError } from "../src/utils/AppError.js";

const mockPasswordTokenRepo = {
  createToken: jest.fn(),
  findByTokenHash: jest.fn(),
  consumeToken: jest.fn(),
  invalidateAllForUser: jest.fn(),
  findLatestByUserIdAndPurpose: jest.fn(),
};

const mockUserRepo = {
  findByUserId: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  list: jest.fn(),
  insert: jest.fn(),
  updateById: jest.fn(),
  updateByUserId: jest.fn(),
};

const mockEmailService = {
  sendInviteEmail: jest.fn(),
  sendResetEmail: jest.fn(),
  sendWelcomeCredentialsEmail: jest.fn(),
  sendEmail: jest.fn(),
  buildResetUrl: jest.fn((token) => `http://localhost:5173/reset-password?token=${token}`),
  buildLoginUrl: jest.fn(() => `http://localhost:5173/login`),
};

jest.unstable_mockModule("../src/repositories/passwordTokenRepository.js", () => mockPasswordTokenRepo);
jest.unstable_mockModule("../src/repositories/userRepository.js", () => mockUserRepo);
jest.unstable_mockModule("../src/services/emailService.js", () => mockEmailService);

const authService = await import("../src/services/authService.js");
const userService = await import("../src/services/userService.js");
const authController = await import("../src/controllers/auth.controller.js");

describe("Password Reset & Setup by Email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Password Policy Schema", () => {
    test("rejects password shorter than 8 characters", () => {
      const r = passwordSchema.safeParse("Pass1");
      expect(r.success).toBe(false);
    });

    test("rejects password longer than 72 characters", () => {
      const longPass = "A1" + "a".repeat(71); // 73 chars
      const r = passwordSchema.safeParse(longPass);
      expect(r.success).toBe(false);
    });

    test("rejects password without digits", () => {
      const r = passwordSchema.safeParse("OnlyLettersPass");
      expect(r.success).toBe(false);
    });

    test("rejects password without letters", () => {
      const r = passwordSchema.safeParse("1234567890");
      expect(r.success).toBe(false);
    });

    test("accepts valid passwords meeting all criteria", () => {
      expect(passwordSchema.safeParse("Secret123").success).toBe(true);
      expect(passwordSchema.safeParse("a1" + "b".repeat(70)).success).toBe(true); // 72 chars
    });

    test("registerUserSchema allows optional password but validates if provided", () => {
      const withoutPassword = registerUserSchema.safeParse({
        body: {
          userId: "123",
          email: "test@school.local",
          role: "parent",
          firstName: "John",
          lastName: "Doe",
        },
      });
      expect(withoutPassword.success).toBe(true);

      const withBadPassword = registerUserSchema.safeParse({
        body: {
          userId: "123",
          email: "test@school.local",
          password: "short",
          role: "parent",
          firstName: "John",
          lastName: "Doe",
        },
      });
      expect(withBadPassword.success).toBe(false);
    });

    test("updateMeSchema validates password against shared policy", () => {
      expect(updateMeSchema.safeParse({ body: { password: "Valid123" } }).success).toBe(true);
      expect(updateMeSchema.safeParse({ body: { password: "invalid" } }).success).toBe(false);
    });

    test("resetPasswordSchema validates token and password", () => {
      expect(resetPasswordSchema.safeParse({ body: { token: "abc", password: "Valid123" } }).success).toBe(true);
      expect(resetPasswordSchema.safeParse({ body: { token: "abc", password: "bad" } }).success).toBe(false);
      expect(resetPasswordSchema.safeParse({ body: { token: "", password: "Valid123" } }).success).toBe(false);
    });
  });

  describe("Token mechanism & security", () => {
    test("token creation stores only sha256 hash and never the raw token", () => {
      const { rawToken, tokenHash } = authService.generateToken();
      expect(typeof rawToken).toBe("string");
      expect(rawToken.length).toBeGreaterThan(32);
      expect(tokenHash).toBe(crypto.createHash("sha256").update(rawToken).digest("hex"));
      expect(rawToken).not.toBe(tokenHash);
    });

    test("validatePasswordToken succeeds for active token and rejects expired/used/missing token", async () => {
      const rawToken = "sample-raw-token";
      const tokenHash = authService.hashToken(rawToken);

      // Active and valid
      mockPasswordTokenRepo.findByTokenHash.mockResolvedValueOnce({
        tokenHash,
        purpose: "reset",
        usedAt: null,
        expiresAt: new Date(Date.now() + 100000),
      });
      const validRes = await authService.validatePasswordToken(rawToken);
      expect(validRes).toEqual({ valid: true, purpose: "reset" });

      // Already used
      mockPasswordTokenRepo.findByTokenHash.mockResolvedValueOnce({
        tokenHash,
        purpose: "reset",
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
      });
      await expect(authService.validatePasswordToken(rawToken)).rejects.toThrow(
        new AppError("Invalid or expired token", 400),
      );

      // Expired
      mockPasswordTokenRepo.findByTokenHash.mockResolvedValueOnce({
        tokenHash,
        purpose: "reset",
        usedAt: null,
        expiresAt: new Date(Date.now() - 10000),
      });
      await expect(authService.validatePasswordToken(rawToken)).rejects.toThrow(
        new AppError("Invalid or expired token", 400),
      );

      // Missing
      mockPasswordTokenRepo.findByTokenHash.mockResolvedValueOnce(null);
      await expect(authService.validatePasswordToken(rawToken)).rejects.toThrow(
        new AppError("Invalid or expired token", 400),
      );
    });

    test("reset consumes token atomically and invalidates other tokens for that user", async () => {
      const rawToken = "valid-token-for-reset";
      const tokenHash = authService.hashToken(rawToken);
      const userId = "550e8400-e29b-41d4-a716-446655440000";

      mockPasswordTokenRepo.consumeToken.mockResolvedValueOnce({
        tokenHash,
        userId,
        purpose: "reset",
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 10000),
      });
      mockUserRepo.updateById.mockResolvedValueOnce({
        id: userId,
        passwordSet: true,
      });
      mockPasswordTokenRepo.invalidateAllForUser.mockResolvedValueOnce();

      const res = await authService.resetPassword(rawToken, "NewSecret123");
      expect(res.message).toBe("Password updated successfully");
      expect(mockPasswordTokenRepo.consumeToken).toHaveBeenCalledWith(tokenHash);
      expect(mockUserRepo.updateById).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ passwordSet: true }),
      );
      expect(mockPasswordTokenRepo.invalidateAllForUser).toHaveBeenCalledWith(userId);
    });
  });

  describe("Forgot-Password Timing & Enumeration Protection", () => {
    test("forgot-password returns identical responses for existing, non-existing, and suspended users", async () => {
      mockPasswordTokenRepo.findLatestByUserIdAndPurpose.mockResolvedValue(null);
      mockPasswordTokenRepo.createToken.mockResolvedValue({});
      mockEmailService.sendResetEmail.mockResolvedValue({});

      // Case 1: Existing active user -> sends email
      mockUserRepo.findByEmail.mockResolvedValueOnce({
        id: "u1",
        email: "active@school.local",
        firstName: "Active",
        isActive: true,
      });
      await authService.requestPasswordReset("active@school.local");
      expect(mockEmailService.sendResetEmail).toHaveBeenCalledTimes(1);

      // Case 2: Non-existing user -> does not send email, does not throw
      mockEmailService.sendResetEmail.mockClear();
      mockUserRepo.findByEmail.mockResolvedValueOnce(null);
      await expect(authService.requestPasswordReset("missing@school.local")).resolves.toBeUndefined();
      expect(mockEmailService.sendResetEmail).not.toHaveBeenCalled();

      // Case 3: Suspended user -> does not send email, does not throw
      mockEmailService.sendResetEmail.mockClear();
      mockUserRepo.findByEmail.mockResolvedValueOnce({
        id: "u2",
        email: "suspended@school.local",
        firstName: "Suspended",
        isActive: false,
      });
      await expect(authService.requestPasswordReset("suspended@school.local")).resolves.toBeUndefined();
      expect(mockEmailService.sendResetEmail).not.toHaveBeenCalled();

      // Controller always responds 200 with identical generic Hebrew message
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await authController.forgotPassword(
        { validated: { body: { email: "any@example.com" } } },
        mockRes,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "אם הכתובת קיימת במערכת, נשלח אליה קישור לאיפוס סיסמה",
      });
    });
  });

  describe("Registration without password & Invite flow", () => {
    test("register without password sends invite email and sets passwordSet=false", async () => {
      mockUserRepo.insert.mockImplementation(async (payload) => ({
        id: "new-user-uuid",
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        firstName: payload.firstName,
        lastName: payload.lastName,
        isActive: true,
        passwordSet: payload.passwordSet,
      }));
      mockPasswordTokenRepo.createToken.mockResolvedValue({});
      mockEmailService.sendInviteEmail.mockResolvedValue({});
      mockEmailService.sendWelcomeCredentialsEmail.mockResolvedValue({});

      const result = await userService.registerUser({
        userId: "987654321",
        email: "invited@school.local",
        role: "teacher",
        firstName: "Teacher",
        lastName: "One",
      });

      expect(mockUserRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "987654321",
          email: "invited@school.local",
          passwordSet: false,
        }),
      );
      expect(mockEmailService.sendInviteEmail).toHaveBeenCalledTimes(1);
      expect(result.passwordSet).toBe(false);
      expect(result.inviteSent).toBe(true);
    });

    test("register with password sets passwordSet=true and does not send invite", async () => {
      mockUserRepo.insert.mockImplementation(async (payload) => ({
        id: "user-with-pass",
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        firstName: payload.firstName,
        lastName: payload.lastName,
        isActive: true,
        passwordSet: payload.passwordSet,
      }));
      mockEmailService.sendInviteEmail.mockResolvedValue({});
      mockEmailService.sendWelcomeCredentialsEmail.mockResolvedValue({});

      const result = await userService.registerUser({
        userId: "111222333",
        email: "direct@school.local",
        password: "SecretPassword123",
        role: "parent",
        firstName: "Parent",
        lastName: "Two",
      });

      expect(mockUserRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordSet: true,
        }),
      );
      expect(mockEmailService.sendInviteEmail).not.toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeCredentialsEmail).toHaveBeenCalledTimes(1);
      expect(result.passwordSet).toBe(true);
      expect(result.inviteSent).toBe(false);
      expect(result.welcomeSent).toBe(true);
    });
  });

  describe("Login blocking for passwordSet=false", () => {
    test("login is blocked when passwordSet is false with the same generic 401 as wrong password", async () => {
      mockUserRepo.findByUserId.mockResolvedValue({
        id: "pending-user-id",
        userId: "987654321",
        password: "$2b$12$eXampleRandomBcryptHash",
        role: "teacher",
        isActive: true,
        passwordSet: false,
      });

      await expect(authService.login("987654321", "AnyPassword123")).rejects.toThrow(
        new AppError("Invalid credentials", 401),
      );
    });
  });
});