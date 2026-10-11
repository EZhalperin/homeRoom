import { api } from "./axiosClient.js";

export const teacherCreateForm = (body) => api.post("/teachers/forms", body).then((r) => r.data);
export const teacherUpdateForm = (body) => api.put("/teachers/forms", body).then((r) => r.data);
export const parentApproveForm = (studentId, title) =>
  api
    .patch(`/parents/students/${studentId}/forms/${encodeURIComponent(title)}/approve`)
    .then((r) => r.data);
