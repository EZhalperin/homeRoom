import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createTableCrud } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";

const usersTable = createTableCrud("users");
const SALT_ROUNDS = 12;
const GENERIC_AUTH_MESSAGE = "Invalid credentials";

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isNotFound(err) {
  return Boolean(
    err &&
      (err.code === "PGRST116" ||
        err.details === "The result contains 0 rows" ||
        /0 rows/i.test(String(err.message || ""))),
  );
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isUniqueViolation(err) {
  return Boolean(
    err &&
      (err.code === "23505" || /duplicate|unique/i.test(String(err.message || ""))),
  );
}

/**
 * @param {object} user
 * @returns {object}
 */
export function toPublicUser(user) {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    userId: user.userId,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
  };
}

/**
 * @param {string} plain
 * @returns {Promise<string>}
 */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/**
 * @param {{ id: string, userId: string, role: string }} user
 * @returns {string}
 */
export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("Server misconfigured", 500);
  }
  return jwt.sign(
    { id: user.id, userId: user.userId, role: user.role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
  );
}

/**
 * @param {string} token
 * @returns {object}
 */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("Server misconfigured", 500);
  }
  try {
    return jwt.verify(token, secret);
  } catch {
    throw new AppError("Authentication required", 401);
  }
}

/**
 * @param {string} userId National ID.
 * @returns {Promise<object|null>}
 */
export async function findByUserId(userId) {
  try {
    return await usersTable.getByUserId(userId);
  } catch (err) {
    if (isNotFound(err)) {
      return null;
    }
    throw err;
  }
}

/**
 * Repository update is keyed by national `userId`, so uuid lookup scans the table.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function findById(id) {
  const all = await usersTable.getAll();
  return all.find((user) => user.id === id) ?? null;
}

/**
 * @returns {Promise<object[]>}
 */
export async function listUsers() {
  return usersTable.getAll();
}

/**
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function createUser(payload) {
  const data = await usersTable.create(payload);
  return Array.isArray(data) ? data[0] : data;
}

/**
 * @param {string} userId National ID.
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function updateUserByUserId(userId, payload) {
  const data = await usersTable.update(userId, payload);
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Login by national ID + password. Same 401 for unknown user and bad password.
 *
 * @param {string} userId
 * @param {string} password
 * @returns {Promise<object>}
 */
export async function login(userId, password) {
  const user = await findByUserId(userId);
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
  const pub = toPublicUser(user);
  return {
    token,
    id: pub.id,
    firstName: pub.firstName,
    lastName: pub.lastName,
    role: pub.role,
    message: "Logged in successfully",
  };
}
