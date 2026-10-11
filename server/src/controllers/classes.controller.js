import { asyncHandler } from "../utils/asyncHandler.js";
import * as classService from "../services/classService.js";

export const createClass = asyncHandler(async (req, res) => {
  const { teacherId, className } = req.body;
  const result = await classService.createClass({ teacherId, className });
  res.status(201).json({ message: "Class created successfully", ...result });
});

export const listClasses = asyncHandler(async (req, res) => {
  const { className, isActive } = req.query;
  res.json(await classService.listClasses(req.user, { className, isActive }));
});

export const getMyClass = asyncHandler(async (req, res) => {
  res.json(await classService.getMyClass(req.user.userId));
});

export const deleteClass = asyncHandler(async (req, res) => {
  const result = await classService.deleteClass(req.params.id);
  res.json({ message: "Class deleted successfully", ...result });
});