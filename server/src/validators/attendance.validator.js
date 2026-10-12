import { z } from "zod";
import { studentUuid } from "./common.js";

const studentParam = z.object({
  id: studentUuid,
});

const attendanceBody = z.object({
  date: z.coerce.date(),
  type: z.enum(["absence", "late"]),
});

export const createAttendanceSchema = z.object({
  params: studentParam,
  body: attendanceBody,
});

export const updateAttendanceSchema = z.object({
  params: studentParam,
  body: attendanceBody,
});
