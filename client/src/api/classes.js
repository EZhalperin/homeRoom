import { api } from "./axiosClient.js";

export const adminCreateClass = (body) => api.post("/admin/classes", body).then((r) => r.data);
export const staffListClasses = (params) => api.get("/staff/classes", { params }).then((r) => r.data);
export const getMyClass = () => api.get("/teachers/my-class").then((r) => r.data);
export const adminDeleteClass = (id) => api.delete(`/admin/classes/${id}`).then((r) => r.data);
