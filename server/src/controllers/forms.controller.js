import { asyncHandler } from "../utils/asyncHandler.js";
import * as formService from "../services/formService.js";

export const distributeForm = asyncHandler(async (req, res) => {
  const { title, description, deadline } = req.validated.body;
  const result = await formService.createForm({
    teacherUserId: req.user.userId,
    title,
    description,
    deadline,
  });
  res.status(201).json({ message: "Form distributed successfully", ...result });
});

export const updateForm = asyncHandler(async (req, res) => {
  const { title, deadline, description, newDeadline } = req.validated.body;
  const result = await formService.updateForm({
    teacherUserId: req.user.userId,
    title,
    deadline,
    description,
    newDeadline,
  });
  res.json({ message: "Form updated successfully", ...result });
});

export const approveForm = asyncHandler(async (req, res) => {
  let title = req.validated.params.title;
  try {
    title = decodeURIComponent(title);
  } catch {
    // Express already decodes once; keep the raw value if a second decode fails.
  }
  const result = await formService.approveForm({
    parentUserId: req.user.userId,
    studentUuid: req.validated.params.id,
    title,
  });
  res.json({ message: "Form approved successfully", ...result });
});
