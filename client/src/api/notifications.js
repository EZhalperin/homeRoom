import { api } from "./axiosClient.js";

export async function getNotifications(params = {}) {
  const res = await api.get("/notifications", { params });
  return res.data;
}

export async function getUnreadNotificationCount() {
  const res = await api.get("/notifications/unread-count");
  return res.data;
}

export async function markNotificationRead(id) {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await api.post("/notifications/read-all");
  return res.data;
}