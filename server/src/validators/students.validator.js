import { z } from "zod";
import { studentUuid } from "./common.js";
import { mongoId } from "./classes.validator.js";

export const addStudentSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
  body: z.object({
    studentId: z.string().min(1, "studentId is required"),
    firstName: z.string().min(1, "firstName is required"),
    lastName: z.string().min(1, "lastName is required"),
  }),
});

export const classStudentsParamSchema = z.object({
  params: z.object({
    id: mongoId,
  }),
});

export const deleteStudentSchema = z.object({
  params: z.object({
    classId: mongoId,
    id: studentUuid,
  }),
});

export const studentIdParamSchema = z.object({
  params: z.object({
    id: studentUuid,
  }),
});