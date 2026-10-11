import { api } from "./axiosClient.js";

export const addAttendance = (studentId, body) =>
  api.post(`/teachers/students/${studentId}/attendance`, body).then((r) => r.data);
export const updateAttendance = (studentId, body) =>
  api.put(`/teachers/students/${studentId}/attendance`, body).then((r) => r.data);
