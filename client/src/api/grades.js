import { api } from "./axiosClient.js";

export const addGrade = (studentId, body) =>
  api.post(`/teachers/students/${studentId}/grades`, body).then((r) => r.data);
export const updateGrade = (studentId, body) =>
  api.put(`/teachers/students/${studentId}/grades`, body).then((r) => r.data);
