import { api } from "./axiosClient.js";

export async function getOrCreateChatRoom({ studentUuid } = {}) {
  const res = await api.post("/chat/rooms", { studentUuid });
  return res.data;
}

export async function getChatRooms() {
  const res = await api.get("/chat/rooms");
  return res.data;
}

export async function getChatMessages(roomId, params = {}) {
  const res = await api.get(`/chat/rooms/${roomId}/messages`, { params });
  return res.data;
}

export async function sendChatMessage(roomId, text) {
  const res = await api.post(`/chat/rooms/${roomId}/messages`, { text });
  return res.data;
}

export async function markChatRoomRead(roomId) {
  const res = await api.patch(`/chat/rooms/${roomId}/read`);
  return res.data;
}