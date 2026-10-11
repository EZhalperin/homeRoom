import { randomUUID } from "node:crypto";
import { Class } from "../models/Class.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { weightedAverage } from "../services/gradeService.js";

export const addStudent = asyncHandler(async (req, res) => {
  const classDoc = await Class.findById(req.params.id);
  if (!classDoc || classDoc.isActive === false) {
    throw new AppError("Class not found", 404);
  }

  const { studentId, firstName, lastName } = req.body;
  const duplicate = await Class.findOne({
    isActive: true,
    "students.studentId": studentId,
  });
  if (duplicate) {
    throw new AppError("Student already exists in an active class", 409);
  }

  const student = {
    id: randomUUID(),
    studentId,
    firstName,
    lastName,
    academicRiskIndex: 0,
    grades: [],
    attendance: [],
    forms: [],
  };

  await Class.updateOne({ _id: classDoc._id }, { $push: { students: student } });
  res.status(201).json({
    message: "Student added successfully",
    studentId,
    firstName,
    lastName,
  });
});

export const listAllStudents = asyncHandler(async (req, res) => {
  const students = await Class.aggregate([
    { $match: { isActive: true } },
    { $unwind: "$students" },
    {
      $project: {
        _id: 0,
        id: "$students.id",
        studentId: "$students.studentId",
        firstName: "$students.firstName",
        lastName: "$students.lastName",
        academicRiskIndex: "$students.academicRiskIndex",
        classId: "$_id",
        className: "$className",
      },
    },
  ]);
  res.json(students);
});

export const listClassStudents = asyncHandler(async (req, res) => {
  const classDoc = req.ownedClass;
  res.json(classDoc.students);
});

export const getMyChild = asyncHandler(async (req, res) => {
  const classDoc = await Class.findOne({
    isActive: true,
    "students.studentId": req.user.userId,
  }).lean();

  if (!classDoc) {
    throw new AppError("Student not found", 404);
  }

  const student = classDoc.students.find(
    (entry) => entry.studentId === req.user.userId,
  );
  if (!student) {
    throw new AppError("Student not found", 404);
  }

  res.json({
    firstName: student.firstName,
    lastName: student.lastName,
    grades: student.grades,
    forms: student.forms,
    attendance: student.attendance,
    weightedAverages: weightedAverage(student.grades),
  });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const classDoc = await Class.findById(req.params.classId);
  if (!classDoc) {
    throw new AppError("Class not found", 404);
  }

  const student = classDoc.students.find((entry) => entry.id === req.params.id);
  if (!student) {
    throw new AppError("Student not found", 404);
  }

  await Class.updateOne(
    { _id: classDoc._id },
    { $pull: { students: { id: req.params.id } } },
  );

  res.json({
    message: "Student removed successfully",
    id: student.id,
    classId: String(classDoc._id),
    firstName: student.firstName,
    lastName: student.lastName,
  });
});
