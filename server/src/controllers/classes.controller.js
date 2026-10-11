import { Class } from "../models/Class.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { findByUserId } from "../services/authService.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const createClass = asyncHandler(async (req, res) => {
  const { teacherId, className } = req.body;
  const teacher = await findByUserId(teacherId);
  if (!teacher || teacher.role !== "teacher" || teacher.isActive === false) {
    throw new AppError("Teacher not found or inactive", 400);
  }

  const existing = await Class.findOne({ teacherId, isActive: true });
  if (existing) {
    throw new AppError("Teacher already has an active class", 409);
  }

  await Class.create({ teacherId, className, students: [], isActive: true });
  res.status(201).json({
    message: "Class created successfully",
    teacherId,
    className,
  });
});

export const listClasses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "teacher") {
    filter.teacherId = req.user.userId;
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive;
  }
  if (req.query.className) {
    filter.className = {
      $regex: escapeRegex(req.query.className),
      $options: "i",
    };
  }

  const classes = await Class.aggregate([
    { $match: filter },
    {
      $addFields: {
        studentsCount: { $size: { $ifNull: ["$students", []] } },
      },
    },
    { $project: { students: 0 } },
  ]);

  res.json(classes);
});

export const getMyClass = asyncHandler(async (req, res) => {
  const classDoc = await Class.findOne({
    teacherId: req.user.userId,
    isActive: true,
  }).lean();

  if (!classDoc) {
    throw new AppError("Class not found", 404);
  }

  res.json({
    className: classDoc.className,
    students: classDoc.students,
  });
});

export const deleteClass = asyncHandler(async (req, res) => {
  const classDoc = await Class.findById(req.params.id);
  if (!classDoc) {
    throw new AppError("Class not found", 404);
  }

  await Class.updateOne({ _id: classDoc._id }, { $set: { isActive: false } });
  res.json({
    message: "Class deleted successfully",
    id: String(classDoc._id),
    className: classDoc.className,
  });
});
