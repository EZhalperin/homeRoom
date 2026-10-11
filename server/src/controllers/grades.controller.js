import { Class } from "../models/Class.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { calculate } from "../services/riskIndexService.js";

function sameTime(a, b) {
  return new Date(a).getTime() === new Date(b).getTime();
}

async function persistRisk(classId, student) {
  const academicRiskIndex = calculate(student, new Date());
  await Class.updateOne(
    { _id: classId, "students.id": student.id },
    { $set: { "students.$.academicRiskIndex": academicRiskIndex } },
  );
  return academicRiskIndex;
}

async function reloadStudent(classId, studentId) {
  const classDoc = await Class.findById(classId);
  return classDoc.students.find((entry) => entry.id === studentId);
}

export const addGrade = asyncHandler(async (req, res) => {
  const { subject, taskName, score, weight, date } = req.body;
  const studentId = req.params.id;
  const classId = req.ownedClass._id;

  await Class.updateOne(
    { _id: classId, "students.id": studentId },
    { $push: { "students.$.grades": { subject, taskName, score, weight, date } } },
  );

  const student = await reloadStudent(classId, studentId);
  await persistRisk(classId, student);

  res.status(201).json({
    message: "Grade added successfully",
    id: studentId,
    subject,
    taskName,
    score,
    weight,
    date,
  });
});

export const updateGrade = asyncHandler(async (req, res) => {
  const { score, subject, date, taskName } = req.body;
  const student = req.ownedStudent;
  const classId = req.ownedClass._id;

  const bySubjectDate = student.grades.filter(
    (grade) => grade.subject === subject && sameTime(grade.date, date),
  );
  if (bySubjectDate.length === 0) {
    throw new AppError("Grade not found", 404);
  }
  if (bySubjectDate.length > 1 && !taskName) {
    throw new AppError("Multiple grades match; provide taskName", 409);
  }

  const matches = taskName
    ? bySubjectDate.filter((grade) => grade.taskName === taskName)
    : bySubjectDate;
  if (matches.length === 0) {
    throw new AppError("Grade not found", 404);
  }
  if (matches.length > 1) {
    throw new AppError("Multiple grades match; provide taskName", 409);
  }

  const arrayFilters = [
    { "s.id": student.id },
    taskName
      ? { "g.subject": subject, "g.date": new Date(date), "g.taskName": taskName }
      : { "g.subject": subject, "g.date": new Date(date) },
  ];

  const result = await Class.updateOne(
    { _id: classId },
    { $set: { "students.$[s].grades.$[g].score": score } },
    { arrayFilters },
  );

  if (result.matchedCount === 0) {
    throw new AppError("Grade not found", 404);
  }

  const updatedStudent = await reloadStudent(classId, student.id);
  await persistRisk(classId, updatedStudent);

  res.json({
    message: "Grade updated successfully",
    score,
    subject,
    date,
  });
});
