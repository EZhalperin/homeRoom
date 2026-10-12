import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import * as userRepository from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";

const SALT_ROUNDS = 12;
const GENERIC_AUTH_MESSAGE = "Invalid credentials";
const JWT_ALG = "HS256";

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
  };
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
