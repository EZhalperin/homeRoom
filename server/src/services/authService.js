import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import * as userRepository from "../repositories/userRepository.js";
import * as passwordTokenRepository from "../repositories/passwordTokenRepository.js";
import * as emailService from "./emailService.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

const SALT_ROUNDS = 12;
const GENERIC_AUTH_MESSAGE = "Invalid credentials";
const JWT_ALG = "HS256";

export const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
export const INVITE_TOKEN_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours
export const RESET_COOLDOWN_MS = 60 * 1000; // 60 seconds

/**
 * @param {object} user
 * @returns {object|null}
 */
export function toPublicUser(user) {
  if (!user) return null;
  return {
    id: String(user.id),
    userId: user.userId,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    passwordSet: user.passwordSet ?? true,
  };
}

export function generateToken() {
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign(
    { id: String(user.id), userId: user.userId, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, algorithm: JWT_ALG },
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALG] });
  } catch {
    throw new AppError("Authentication required", 401);
  }
}

export async function findByUserId(userId) {
  return userRepository.findByUserId(userId, { includePassword: true });
}

export async function findById(id) {
  return userRepository.findById(id);
}

/**
 * @param {string} userId
 * @param {string} password
 */
export async function login(userId, password) {
  const user = await userRepository.findByUserId(userId, { includePassword: true });
  if (!user) {
    throw new AppError(GENERIC_AUTH_MESSAGE, 401);
  }
  // Users who have not yet set their initial password cannot log in
  if (user.passwordSet === false) {
    throw new AppError(GENERIC_AUTH_MESSAGE, 401);
  }
  const ok = await comparePassword(password, user.password);
  if (!ok) {
    throw new AppError(GENERIC_AUTH_MESSAGE, 401);
  }
  if (user.isActive === false) {
    throw new AppError("Account is suspended", 403);
  }
  const token = signToken(user);
  return {
    token,
    message: "Logged in successfully",
    ...toPublicUser(user),
  };
}

/**
 * Background processing for forgot-password:
 * Dispatches a password reset email if the user exists and is active,
 * respecting a 60-second per-email cooldown.
 * @param {string} email
 */
export async function requestPasswordReset(email) {
  const user = await userRepository.findByEmail(email);
  if (!user || user.isActive === false) {
    return;
  }

  // Per-email cooldown (60 seconds)
  const latest = await passwordTokenRepository.findLatestByUserIdAndPurpose(user.id, "reset");
  if (latest && Date.now() - new Date(latest.createdAt).getTime() < RESET_COOLDOWN_MS) {
    logger.info(`Password reset cooldown active for user ${user.id}`);
    return;
  }

  const { rawToken, tokenHash } = generateToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await passwordTokenRepository.createToken({
    userId: user.id,
    purpose: "reset",
    tokenHash,
    expiresAt,
  });

  await emailService.sendResetEmail({
    email: user.email,
    firstName: user.firstName,
    token: rawToken,
  });
}

/**
 * Validates a password token without consuming it.
 * @param {string} rawToken
 * @returns {Promise<{ valid: true, purpose: "invite"|"reset" }>}
 */
export async function validatePasswordToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const doc = await passwordTokenRepository.findByTokenHash(tokenHash);
  const now = new Date();

  if (!doc || doc.usedAt !== null || doc.expiresAt <= now) {
    throw new AppError("Invalid or expired token", 400);
  }

  return { valid: true, purpose: doc.purpose };
}

/**
 * Consumes a token and sets a new password.
 * Invalidates all other tokens for this user.
 * @param {string} rawToken
 * @param {string} newPassword
 */
export async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken);
  const doc = await passwordTokenRepository.consumeToken(tokenHash);

  if (!doc) {
    throw new AppError("Invalid or expired token", 400);
  }

  const hashedPassword = await hashPassword(newPassword);
  await userRepository.updateById(doc.userId, {
    password: hashedPassword,
    passwordSet: true,
  });

  await passwordTokenRepository.invalidateAllForUser(doc.userId);

  return { message: "Password updated successfully" };
}

/**
 * Creates an invite token for a user.
 * @param {string} userId
 * @returns {Promise<string>} rawToken
 */
export async function createInviteToken(userId) {
  const { rawToken, tokenHash } = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_EXPIRY_MS);

  await passwordTokenRepository.createToken({
    userId,
    purpose: "invite",
    tokenHash,
    expiresAt,
  });

  return rawToken;
}