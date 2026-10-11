import { Class } from "../models/Class.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { calculate } from "../services/riskIndexService.js";

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

async function persistRisk(classId, student) {
  const academicRiskIndex = calculate(student, new Date());
  await Class.updateOne(
    { _id: classId, "students.id": student.id },
    { $set: { "students.$.academicRiskIndex": academicRiskIndex } },
  );
}

async function reloadStudent(classId, studentId) {
  const classDoc = await Class.findById(classId);
  return classDoc.students.find((entry) => entry.id === studentId);
}

export const addAttendance = asyncHandler(async (req, res) => {
  const { date, type } = req.body;
  const student = req.ownedStudent;
  const classId = req.ownedClass._id;
  const key = dayKey(date);

  const duplicate = student.attendance.some(
    (record) => dayKey(record.date) === key && record.type === type,
  );
  if (duplicate) {
    throw new AppError("Attendance record already exists", 409);
  }

  await Class.updateOne(
    { _id: classId, "students.id": student.id },
    { $push: { "students.$.attendance": { date, type } } },
  );

  const updated = await reloadStudent(classId, student.id);
  await persistRisk(classId, updated);

  res.status(201).json({
    message: "Attendance recorded successfully",
    studentId: student.studentId,
    date,
    type,
  });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const { date, type } = req.body;
  const student = req.ownedStudent;
  const classId = req.ownedClass._id;
  const key = dayKey(date);

  const matches = student.attendance.filter((record) => dayKey(record.date) === key);
  if (matches.length === 0) {
    throw new AppError("Attendance record not found", 404);
  }
  if (matches.length > 1) {
    throw new AppError("Multiple attendance records match this date", 409);
  }

  await Class.updateOne(
    { _id: classId },
    { $set: { "students.$[s].attendance.$[a].type": type } },
    {
      arrayFilters: [
        { "s.id": student.id },
        { "a.date": new Date(matches[0].date) },
      ],
    },
  );

  const updated = await reloadStudent(classId, student.id);
  await persistRisk(classId, updated);

  res.json({
    message: "Attendance updated successfully",
    type,
    date,
  });
});
