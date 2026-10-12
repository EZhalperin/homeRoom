import * as userRepository from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword, toPublicUser } from "./authService.js";

export async function registerUser({ userId, email, password, role, firstName, lastName }) {
  const created = await userRepository.insert({
    userId,
    email,
    password: await hashPassword(password),
    role,
    firstName,
    lastName,
    isActive: true,
  });
  return toPublicUser(created);
}

export async function listUsers({ role, isActive, fullName } = {}) {
  let users = await userRepository.list();
  if (role) {
    users = users.filter((user) => user.role === role);
  }
  if (isActive !== undefined) {
    users = users.filter((user) => user.isActive === isActive);
  }
  if (fullName) {
    const needle = String(fullName).toLowerCase();
    users = users.filter((user) =>
      `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase().includes(needle),
    );
  }
  return users.map(toPublicUser);
}

export async function updateUser(id, patch, { actorId }) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (patch.isActive === false && String(user.id) === String(actorId)) {
    throw new AppError("An admin cannot suspend themselves", 403);
  }
  const updated = await userRepository.updateById(id, patch);
  return toPublicUser(updated);
}

export async function updateMe(userId, { password, firstName, lastName, email }) {
  const patch = {};
  if (firstName !== undefined) patch.firstName = firstName;
  if (lastName !== undefined) patch.lastName = lastName;
  if (email !== undefined) patch.email = email;
  if (password !== undefined) patch.password = await hashPassword(password);
  const updated = await userRepository.updateByUserId(userId, patch);
  return toPublicUser(updated);
}

export async function suspendUser(id, { actorId }) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (String(user.id) === String(actorId)) {
    throw new AppError("An admin cannot delete themselves", 403);
  }
  const updated = await userRepository.updateById(id, { isActive: false });
  return toPublicUser(updated);
}
