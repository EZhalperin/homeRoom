import { ObjectId } from "mongodb";

/**
 * Document shapes for the `chatRooms` collection (native driver, no schemas).
 * @module models/ChatRoom
 */

export const COLLECTION = "chatRooms";

/**
 * @typedef {Object} ChatRoomDoc
 * @property {import("mongodb").ObjectId} [_id]
 * @property {string} classId
 * @property {string} teacherUserId
 * @property {string} studentUuid
 * @property {string} parentUserId
 * @property {string} studentName
 * @property {Date|null} lastMessageAt
 * @property {string|null} lastMessagePreview
 * @property {{ teacher: Date|null, parent: Date|null }} lastReadAt
 */

export function buildChatRoomDoc({ classId, teacherUserId, studentUuid, parentUserId, studentName }) {
  return {
    _id: new ObjectId(),
    classId: String(classId),
    teacherUserId,
    studentUuid,
    parentUserId,
    studentName,
    lastMessageAt: null,
    lastMessagePreview: null,
    lastReadAt: { teacher: null, parent: null },
  };
}