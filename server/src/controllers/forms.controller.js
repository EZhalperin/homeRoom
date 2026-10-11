import { Class } from "../models/Class.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

function sameTime(a, b) {
  return new Date(a).getTime() === new Date(b).getTime();
}

async function teacherActiveClass(teacherId) {
  const classDoc = await Class.findOne({ teacherId, isActive: true });
  if (!classDoc) {
    throw new AppError("Class not found", 404);
  }
  return classDoc;
}

export const distributeForm = asyncHandler(async (req, res) => {
  const { title, description, deadline } = req.body;
  const classDoc = await teacherActiveClass(req.user.userId);

  const exists = classDoc.students.some((student) =>
    student.forms.some(
      (form) => form.title === title && sameTime(form.deadline, deadline),
    ),
  );
  if (exists) {
    throw new AppError("A form with this title and deadline already exists", 409);
  }

  const form = { title, description, deadline, isApproved: false };
  await Class.updateOne(
    { _id: classDoc._id },
    { $push: { "students.$[].forms": form } },
  );

  res.status(201).json({
    message: "Form distributed successfully",
    teacherId: req.user.userId,
    title,
    description,
    deadline,
  });
});

export const updateForm = asyncHandler(async (req, res) => {
  const { title, deadline, description, newDeadline } = req.body;
  const classDoc = await teacherActiveClass(req.user.userId);

  const exists = classDoc.students.some((student) =>
    student.forms.some(
      (form) => form.title === title && sameTime(form.deadline, deadline),
    ),
  );
  if (!exists) {
    throw new AppError("Form not found", 404);
  }

  const set = {};
  if (description !== undefined) {
    set["students.$[].forms.$[f].description"] = description;
  }
  if (newDeadline !== undefined) {
    set["students.$[].forms.$[f].deadline"] = newDeadline;
  }

  await Class.updateOne(
    { _id: classDoc._id },
    { $set: set },
    { arrayFilters: [{ "f.title": title, "f.deadline": new Date(deadline) }] },
  );

  const nextDeadline = newDeadline !== undefined ? newDeadline : deadline;
  const nextDescription =
    description !== undefined
      ? description
      : classDoc.students
          .flatMap((student) => student.forms)
          .find((form) => form.title === title && sameTime(form.deadline, deadline))
          ?.description;

  res.json({
    message: "Form updated successfully",
    description: nextDescription,
    deadline: nextDeadline,
  });
});

export const approveForm = asyncHandler(async (req, res) => {
  let title = req.params.title;
  try {
    title = decodeURIComponent(title);
  } catch {
    // Express already decodes once; keep the raw value if a second decode fails.
  }

  const student = req.ownedStudent;
  const form = student.forms.find((entry) => entry.title === title);
  if (!form) {
    throw new AppError("Form not found", 404);
  }
  if (new Date(form.deadline) < new Date()) {
    throw new AppError("Form deadline has passed", 409);
  }

  await Class.updateOne(
    { _id: req.ownedClass._id },
    { $set: { "students.$[s].forms.$[f].isApproved": true } },
    { arrayFilters: [{ "s.id": student.id }, { "f.title": title }] },
  );

  res.json({
    message: "Form approved successfully",
    title: form.title,
    description: form.description,
    deadline: form.deadline,
    isApproved: true,
  });
});
