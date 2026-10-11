import { api } from "./axiosClient.js";

export const login = (userId, password) =>
  api.post("/auth/login", { userId, password }).then((r) => r.data);
export const logout = () => api.post("/auth/logout").then((r) => r.data);
export const getMe = () => api.get("/auth/me").then((r) => r.data);
