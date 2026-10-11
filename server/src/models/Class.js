import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    taskName: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    weight: { type: Number, required: true, min: 0, max: 1 },
    date: { type: Date, required: true },
  },
  { _id: false },
);

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    type: { type: String, required: true, enum: ["absence", "late"] },
  },
  { _id: false },
);

const formSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    isApproved: { type: Boolean, default: false },
  },
  { _id: false },
);

const studentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    studentId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    academicRiskIndex: { type: Number, default: 0, min: 0, max: 10 },
    grades: { type: [gradeSchema], default: [] },
    attendance: { type: [attendanceSchema], default: [] },
    forms: { type: [formSchema], default: [] },
  },
  { _id: false },
);

const classSchema = new mongoose.Schema({
  teacherId: { type: String, required: true },
  className: { type: String, required: true },
  students: { type: [studentSchema], default: [] },
  isActive: { type: Boolean, default: true },
});

classSchema.index({ teacherId: 1, isActive: 1 });
classSchema.index({ "students.id": 1 });
classSchema.index({ "students.studentId": 1 });

export const Class = mongoose.model("Class", classSchema);
export default Class;
