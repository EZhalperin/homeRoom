import * as chatRepository from "../repositories/chatRepository.js";
import * as studentRepository from "../repositories/studentRepository.js";
import * as studentService from "./studentService.js";
import * as notificationService from "./notificationService.js";
import { buildChatRoomDoc } from "../models/ChatRoom.js";
import { buildChatMessageDoc } from "../models/ChatMessage.js";
import { emitToRoom, isUserInRoom } from "../sockets/realtime.js";
import { AppError } from "../utils/AppError.js";

/** @module services/chatService */

/**
 * Asserts that the user is an authorized participant (teacher or parent) of the chat room.
 * @param {string} roomId
 * @param {object} user
 * @returns {Promise<import("../models/ChatRoom.js").ChatRoomDoc>}
 * @throws {AppError} 404 if not found, 403 if unauthorized
 */
export async function assertParticipant(roomId, user) {
  const room = await chatRepository.findRoomById(roomId);
  if (!room) {
    throw new AppError("Chat room not found", 404);
  }

  if (user.role === "teacher" && room.teacherUserId !== user.userId) {
    throw new AppError("Forbidden", 403);
  }
  if (user.role === "parent" && room.parentUserId !== user.userId) {
    throw new AppError("Forbidden", 403);
  }
  if (user.role !== "teacher" && user.role !== "parent") {
    throw new AppError("Forbidden", 403);
  }

  return room;
}

/**
 * Gets or creates a 1:1 chat room between homeroom teacher and student's parent.
 * @param {object} user - Authenticated user
 * @param {{ studentUuid?: string }} [payload]
 * @returns {Promise<import("../models/ChatRoom.js").ChatRoomDoc>}
 */
export async function getOrCreateRoom(user, { studentUuid } = {}) {
  let classId;
  let teacherUserId;
  let resolvedStudentUuid;
  let parentUserId;
  let studentName;

  if (user.role === "teacher") {
    if (!studentUuid) {
      throw new AppError("studentUuid is required for teachers", 400);
    }
    const resolved = await studentService.resolveTeacherStudent(user.userId, studentUuid);
    classId = String(resolved.classId);
    teacherUserId = user.userId;
    resolvedStudentUuid = studentUuid;
    parentUserId = resolved.student.studentId;
    studentName = `${resolved.student.firstName} ${resolved.student.lastName}`.trim();
  } else if (user.role === "parent") {
    const found = await studentRepository.findActiveStudentByStudentId(user.userId);
    if (!found) {
      throw new AppError("No active class or teacher found for your child", 404);
    }
    classId = String(found.classId);
    teacherUserId = found.teacherId;
    resolvedStudentUuid = found.student.id;
    parentUserId = user.userId;
    studentName = `${found.student.firstName} ${found.student.lastName}`.trim();
  } else {
    throw new AppError("Forbidden", 403);
  }

  let room = await chatRepository.findRoomByClassAndStudent(classId, resolvedStudentUuid);
  if (!room) {
    const doc = buildChatRoomDoc({
      classId,
      teacherUserId,
      studentUuid: resolvedStudentUuid,
      parentUserId,
      studentName,
    });
    room = await chatRepository.createRoom(doc);
  }

  return room;
}

/**
 * Lists all chat rooms for the authenticated user with computed unreadCount.
 * @param {object} user
 */
export async function listRooms(user) {
  if (user.role !== "teacher" && user.role !== "parent") {
    throw new AppError("Forbidden", 403);
  }

  const rooms = await chatRepository.listRoomsForUser(user.userId, user.role);

  const roomsWithUnread = await Promise.all(
    rooms.map(async (room) => {
      const lastRead = room.lastReadAt?.[user.role];
      const unreadCount = await chatRepository.countUnreadMessages({
        roomId: room._id,
        excludeSenderUserId: user.userId,
        since: lastRead,
      });
      return {
        ...room,
        unreadCount,
      };
    }),
  );

  return roomsWithUnread;
}

/**
 * Gets messages in a room with cursor pagination.
 * @param {string} roomId
 * @param {object} user
 * @param {{ before?: string|Date, limit?: number }} [opts]
 */
export async function getMessages(roomId, user, opts = {}) {
  await assertParticipant(roomId, user);
  return chatRepository.listMessages(roomId, opts);
}

/**
 * Sends a message in a room. Updates room preview and notifies recipient if not currently in the room.
 * @param {string} roomId
 * @param {object} user
 * @param {string} text
 */
export async function sendMessage(roomId, user, text) {
  const room = await assertParticipant(roomId, user);

  const trimmedText = (text || "").trim();
  if (!trimmedText || trimmedText.length > 2000) {
    throw new AppError("Message text must be between 1 and 2000 characters", 400);
  }

  const messageDoc = buildChatMessageDoc({
    roomId: room._id,
    senderUserId: user.userId,
    senderRole: user.role,
    text: trimmedText,
  });

  await chatRepository.insertMessage(messageDoc);

  const preview = trimmedText.length > 50 ? `${trimmedText.slice(0, 50)}...` : trimmedText;
  await chatRepository.updateRoomLastMessage(room._id, {
    lastMessageAt: messageDoc.createdAt,
    lastMessagePreview: preview,
    roleKey: user.role,
  });

  // Emit to active sockets in chat:${roomId}
  emitToRoom(`chat:${roomId}`, "chat:message", messageDoc);

  // Recipient resolution
  const recipientUserId = user.role === "teacher" ? room.parentUserId : room.teacherUserId;

  // Notify recipient ONLY if they are not currently in this chat room
  const isOnlineInRoom = isUserInRoom(recipientUserId, `chat:${roomId}`);
  if (!isOnlineInRoom && recipientUserId) {
    const senderName =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      (user.role === "teacher" ? "מחנך/ת הכיתה" : "הורה");

    await notificationService.createMany([recipientUserId], {
      type: "chat",
      title: `הודעה חדשה מאת ${senderName}`,
      body: preview,
      link: `/chat?roomId=${roomId}`,
      data: { roomId: String(room._id), senderUserId: user.userId },
    });
  }

  return messageDoc;
}

/**
 * Marks room as read for the authenticated user and emits 'chat:read' event.
 * @param {string} roomId
 * @param {object} user
 */
export async function markRead(roomId, user) {
  const room = await assertParticipant(roomId, user);
  const now = new Date();

  await chatRepository.updateRoomLastRead(room._id, user.role, now);

  emitToRoom(`chat:${roomId}`, "chat:read", {
    roomId: String(room._id),
    userId: user.userId,
    readAt: now,
  });

  return { ok: true, readAt: now };
}