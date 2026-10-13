import { api } from "./axiosClient.js";

export async function getAnnouncements(params = {}) {
  const res = await api.get("/announcements", { params });
  return res.data;
}

export async function createAnnouncement(payload) {
  const res = await api.post("/announcements", payload);
  return res.data;
}

export async function deleteAnnouncement(id) {
  const res = await api.delete(`/announcements/${id}`);
  return res.data;
}

export async function getAudienceStats() {
  const res = await api.get("/announcements/audience-stats");
  return res.data;
}