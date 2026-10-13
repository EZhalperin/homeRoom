import { asyncHandler } from "../utils/asyncHandler.js";
import * as userService from "../services/userService.js";

export const updateMe = asyncHandler(async (req, res) => {
  const { password, firstName, lastName, email } = req.validated.body;
  const updated = await userService.updateMe(req.user.userId, {
    password,
    firstName,
    lastName,
    email,
  });
  res.json({
    message: "Profile updated successfully",
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
  });
});

export const registerUser = asyncHandler(async (req, res) => {
  const pub = await userService.registerUser(req.validated.body);
  const message =
    pub.inviteSent === false && !req.validated.body.password
      ? "User registered, but failed to send invitation email"
      : "User registered successfully";

  res.status(201).json({
    message,
    userId: pub.userId,
    email: pub.email,
    role: pub.role,
    firstName: pub.firstName,
    lastName: pub.lastName,
    passwordSet: pub.passwordSet,
    inviteSent: pub.inviteSent,
  });
});

export const sendInvite = asyncHandler(async (req, res) => {
  const result = await userService.sendInvite(req.validated.params.id);
  res.json(result);
});

export const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers(req.validated.query);
  res.json(users);
});

export const updateUser = asyncHandler(async (req, res) => {
  const updated = await userService.updateUser(req.validated.params.id, req.validated.body, {
    actorId: req.user.id,
  });
  res.json({
    message: "User updated successfully",
    role: updated.role,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const pub = await userService.suspendUser(req.validated.params.id, { actorId: req.user.id });
  res.json({
    message: "User suspended successfully",
    id: pub.id,
    role: pub.role,
    firstName: pub.firstName,
    lastName: pub.lastName,
  });
});