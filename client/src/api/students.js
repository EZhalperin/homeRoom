import { api } from "./axiosClient.js";

export const adminAddStudent = (classId, body) =>
  api.post(`/admin/classes/${classId}/students`, body).then((r) => r.data);
export const adminListStudents = () => api.get("/admin/students").then((r) => r.data);
export const adminDeleteStudent = (classId, id) =>
  api.delete(`/admin/classes/${classId}/students/${id}`).then((r) => r.data);
export const getMyChild = () => api.get("/parents/my-child").then((r) => r.data);
