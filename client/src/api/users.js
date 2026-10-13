import { api } from "./axiosClient.js";

export const updateMe = (body) => api.patch("/users/me", body).then((r) => r.data);
export const adminListUsers = (params) => api.get("/admin/users", { params }).then((r) => r.data);
export const adminRegister = (body) => api.post("/admin/users/register", body).then((r) => r.data);
export const adminUpdateUser = (id, body) => api.put(`/admin/users/${id}`, body).then((r) => r.data);
export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);
export const adminSendInvite = (id) => api.post(`/admin/users/${id}/send-invite`).then((r) => r.data);