import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { updateMeSchema } from "../validators/users.validator.js";
import {
  createUser,
  findById,
  findByUserId,
  hashPassword,
  isUniqueViolation,
  listUsers,
  toPublicUser,
  updateUserByUserId,
} from "../services/authService.js";

export const updateMe = asyncHandler(async (req, res) => {
  const parsed = updateMeSchema.safeParse({ body: req.body });
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message || "Validation error";
    throw new AppError(message, 400);
  }

  const { password, firstName, lastName } = parsed.data.body;
  const patch = {};
  if (firstName !== undefined) {
    patch.firstName = firstName;
  }
  if (lastName !== undefined) {
    patch.lastName = lastName;
  }
  if (password !== undefined) {
    patch.password = await hashPassword(password);
  }

  const updated = await updateUserByUserId(req.user.userId, patch);
  res.json({
    message: "Profile updated successfully",
    firstName: updated.firstName,
    lastName: updated.lastName,
  });
});

export const registerUser = asyncHandler(async (req, res) => {
  const { userId, password, role, firstName, lastName } = req.body;
  const existing = await findByUserId(userId);
  if (existing) {
    throw new AppError("User already exists", 409);
  }

  try {
    const created = await createUser({
      userId,
      password: await hashPassword(password),
      role,
      firstName,
      lastName,
      isActive: true,
    });
    const pub = toPublicUser(created);
    res.status(201).json({
      message: "User registered successfully",
      userId: pub.userId,
      role: pub.role,
      firstName: pub.firstName,
      lastName: pub.lastName,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError("User already exists", 409);
    }
    throw err;
  }
});

export const getUsers = asyncHandler(async (req, res) => {
  const { role, isActive, fullName } = req.query;
  let users = await listUsers();

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

  res.json(users.map((user) => toPublicUser(user)));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await findById(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (req.body.isActive === false && user.id === req.user.id) {
    throw new AppError("An admin cannot suspend themselves", 403);
  }

  const patch = {};
  for (const field of ["role", "firstName", "lastName", "isActive"]) {
    if (req.body[field] !== undefined) {
      patch[field] = req.body[field];
    }
  }

  const updated = await updateUserByUserId(user.userId, patch);
  res.json({
    message: "User updated successfully",
    role: updated.role,
    firstName: updated.firstName,
    lastName: updated.lastName,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await findById(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.id === req.user.id) {
    throw new AppError("An admin cannot delete themselves", 403);
  }

  const updated = await updateUserByUserId(user.userId, { isActive: false });
  const pub = toPublicUser(updated);
  res.json({
    message: "User suspended successfully",
    id: pub.id,
    role: pub.role,
    firstName: pub.firstName,
    lastName: pub.lastName,
  });
});
