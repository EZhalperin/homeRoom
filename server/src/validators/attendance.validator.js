import { z } from "zod";

const studentParam = z.object({
  id: z.string().uuid("id must be a UUID"),
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
