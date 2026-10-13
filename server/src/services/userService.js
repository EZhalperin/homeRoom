import crypto from "node:crypto";
import * as userRepository from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword, toPublicUser, createInviteToken } from "./authService.js";
import * as emailService from "./emailService.js";
import { logger } from "../utils/logger.js";

export async function registerUser({ userId, email, password, role, firstName, lastName }) {
  const hasProvidedPassword = Boolean(password);
  const passwordSet = hasProvidedPassword;
  const rawPasswordToHash = hasProvidedPassword
    ? password
    : crypto.randomBytes(32).toString("hex");

  const created = await userRepository.insert({
    userId,
    email,
    password: await hashPassword(rawPasswordToHash),
    role,
    firstName,
    lastName,
    isActive: true,
    passwordSet,
  });

  const publicUser = toPublicUser(created);

  if (!hasProvidedPassword) {
    let inviteSent = false;
    try {
      const inviteToken = await createInviteToken(created.id);
      await emailService.sendInviteEmail({
        email: created.email,
        firstName: created.firstName,
        token: inviteToken,
      });
      inviteSent = true;
    } catch (err) {
      logger.error(`Failed to send invite email to ${created.email}:`, err);
      inviteSent = false;
    }

    return {
      ...publicUser,
      inviteSent,
    };
  }

  return {
    ...publicUser,
    inviteSent: false,
  };
}

export async function sendInvite(id) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.passwordSet === true) {
    throw new AppError("User already has a password set", 409);
  }

  const inviteToken = await createInviteToken(user.id);
  await emailService.sendInviteEmail({
    email: user.email,
    firstName: user.firstName,
    token: inviteToken,
  });

  return { message: "Invite email sent successfully" };
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
  if (password !== undefined) {
    patch.password = await hashPassword(password);
    patch.passwordSet = true;
  }
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