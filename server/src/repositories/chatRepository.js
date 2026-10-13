import { getCollection } from "../config/mongo.js";
import { COLLECTION as ROOMS_COLLECTION } from "../models/ChatRoom.js";
import { COLLECTION as MESSAGES_COLLECTION } from "../models/ChatMessage.js";
import { toObjectId } from "../utils/mongoHelpers.js";

/** @module repositories/chatRepository */

const roomsCol = () => getCollection(ROOMS_COLLECTION);
const messagesCol = () => getCollection(MESSAGES_COLLECTION);

export async function findRoomById(roomId) {
  return roomsCol().findOne({ _id: toObjectId(roomId, "room id") });
}

export async function findRoomByClassAndStudent(classId, studentUuid) {
  return roomsCol().findOne({ classId: String(classId), studentUuid });
}

export async function createRoom(doc) {
  await roomsCol().insertOne(doc);
  return doc;
}

export async function listRoomsForUser(userId, role) {
  const query = role === "teacher" ? { teacherUserId: userId } : { parentUserId: userId };
  return roomsCol().find(query).sort({ lastMessageAt: -1, _id: -1 }).toArray();
}

export async function updateRoomLastMessage(roomId, { lastMessageAt, lastMessagePreview, roleKey }) {
  const update = {
    $set: {
      lastMessageAt,
      lastMessagePreview,
      [`lastReadAt.${roleKey}`]: lastMessageAt,
    },
  };
  return roomsCol().findOneAndUpdate(
    { _id: toObjectId(roomId, "room id") },
    update,
    { returnDocument: "after" },
  );
}

export async function updateRoomLastRead(roomId, roleKey, date = new Date()) {
  return roomsCol().findOneAndUpdate(
    { _id: toObjectId(roomId, "room id") },
    { $set: { [`lastReadAt.${roleKey}`]: date } },
    { returnDocument: "after" },
  );
}

export async function insertMessage(doc) {
  await messagesCol().insertOne(doc);
  return doc;
}

export async function listMessages(roomId, { before, limit = 50 } = {}) {
  const query = { roomId: toObjectId(roomId, "room id") };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 50);

  // Return newest messages first (client can invert for display if needed)
  return messagesCol().find(query).sort({ createdAt: -1 }).limit(safeLimit).toArray();
}

export async function countUnreadMessages({ roomId, excludeSenderUserId, since }) {
  const query = {
    roomId: toObjectId(roomId, "room id"),
    senderUserId: { $ne: excludeSenderUserId },
  };
  if (since) {
    query.createdAt = { $gt: new Date(since) };
  }
  return messagesCol().countDocuments(query);
}