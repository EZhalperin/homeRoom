import { jest } from "@jest/globals";
import { ObjectId } from "mongodb";
import { AppError } from "../src/utils/AppError.js";

const VALID_ROOM_ID = new ObjectId().toHexString();

const mockChatRepo = {
  findRoomById: jest.fn(),
  findRoomByClassAndStudent: jest.fn(),
  createRoom: jest.fn(),
  listRoomsForUser: jest.fn(),
  updateRoomLastMessage: jest.fn(),
  updateRoomLastRead: jest.fn(),
  insertMessage: jest.fn(),
  listMessages: jest.fn(),
  countUnreadMessages: jest.fn(),
};

const mockStudentRepo = {
  findActiveStudentByStudentId: jest.fn(),
};

const mockStudentService = {
  resolveTeacherStudent: jest.fn(),
};

const mockNotificationService = {
  createMany: jest.fn(),
};

const mockRealtime = {
  emitToUser: jest.fn(),
  emitToRoom: jest.fn(),
  disconnectUser: jest.fn(),
  isUserInRoom: jest.fn(),
};

jest.unstable_mockModule("../src/repositories/chatRepository.js", () => mockChatRepo);
jest.unstable_mockModule("../src/repositories/studentRepository.js", () => mockStudentRepo);
jest.unstable_mockModule("../src/services/studentService.js", () => mockStudentService);
jest.unstable_mockModule("../src/services/notificationService.js", () => mockNotificationService);
jest.unstable_mockModule("../src/sockets/realtime.js", () => mockRealtime);

const chatService = await import("../src/services/chatService.js");

describe("chatService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("assertParticipant", () => {
    test("succeeds when teacher is room's teacher", async () => {
      mockChatRepo.findRoomById.mockResolvedValue({
        _id: VALID_ROOM_ID,
        teacherUserId: "teacher1",
        parentUserId: "parent1",
      });
      const room = await chatService.assertParticipant(VALID_ROOM_ID, { role: "teacher", userId: "teacher1" });
      expect(room._id).toBe(VALID_ROOM_ID);
    });

    test("succeeds when parent is room's parent", async () => {
      mockChatRepo.findRoomById.mockResolvedValue({
        _id: VALID_ROOM_ID,
        teacherUserId: "teacher1",
        parentUserId: "parent1",
      });
      const room = await chatService.assertParticipant(VALID_ROOM_ID, { role: "parent", userId: "parent1" });
      expect(room._id).toBe(VALID_ROOM_ID);
    });

    test("throws 404 when room not found", async () => {
      mockChatRepo.findRoomById.mockResolvedValue(null);
      await expect(
        chatService.assertParticipant(VALID_ROOM_ID, { role: "teacher", userId: "teacher1" }),
      ).rejects.toThrow(new AppError("Chat room not found", 404));
    });

    test("throws 403 when teacher is not participant", async () => {
      mockChatRepo.findRoomById.mockResolvedValue({
        _id: VALID_ROOM_ID,
        teacherUserId: "otherTeacher",
        parentUserId: "parent1",
      });
      await expect(
        chatService.assertParticipant(VALID_ROOM_ID, { role: "teacher", userId: "teacher1" }),
      ).rejects.toThrow(new AppError("Forbidden", 403));
    });

    test("throws 403 when parent is not participant", async () => {
      mockChatRepo.findRoomById.mockResolvedValue({
        _id: VALID_ROOM_ID,
        teacherUserId: "otherTeacher",
        parentUserId: "otherParent",
      });
      await expect(
        chatService.assertParticipant(VALID_ROOM_ID, { role: "parent", userId: "parent1" }),
      ).rejects.toThrow(new AppError("Forbidden", 403));
    });
  });

  describe("getOrCreateRoom", () => {
    test("teacher creates or gets room with resolved student", async () => {
      mockStudentService.resolveTeacherStudent.mockResolvedValue({
        classId: "class1",
        student: { studentId: "parent1", firstName: "Dan", lastName: "Cohen" },
      });
      mockChatRepo.findRoomByClassAndStudent.mockResolvedValue(null);
      mockChatRepo.createRoom.mockImplementation(async (doc) => ({ ...doc, _id: VALID_ROOM_ID }));

      const res = await chatService.getOrCreateRoom(
        { role: "teacher", userId: "teacher1" },
        { studentUuid: "a0000000-0000-0000-0000-000000000001" },
      );

      expect(mockStudentService.resolveTeacherStudent).toHaveBeenCalledWith("teacher1", "a0000000-0000-0000-0000-000000000001");
      expect(mockChatRepo.createRoom).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: "class1",
          teacherUserId: "teacher1",
          studentUuid: "a0000000-0000-0000-0000-000000000001",
          parentUserId: "parent1",
        }),
      );
      expect(res._id).toBe(VALID_ROOM_ID);
    });

    test("parent creates or gets room with active student class teacher", async () => {
      mockStudentRepo.findActiveStudentByStudentId.mockResolvedValue({
        classId: "class1",
        teacherId: "teacher1",
        student: { id: "a0000000-0000-0000-0000-000000000001", firstName: "Dan", lastName: "Cohen" },
      });
      mockChatRepo.findRoomByClassAndStudent.mockResolvedValue({ _id: VALID_ROOM_ID });

      const res = await chatService.getOrCreateRoom({ role: "parent", userId: "parent1" });

      expect(mockStudentRepo.findActiveStudentByStudentId).toHaveBeenCalledWith("parent1");
      expect(res._id).toBe(VALID_ROOM_ID);
    });
  });

  describe("sendMessage", () => {
    test("sends message, emits to room, and sends notification if recipient is offline", async () => {
      mockChatRepo.findRoomById.mockResolvedValue({
        _id: VALID_ROOM_ID,
        teacherUserId: "teacher1",
        parentUserId: "parent1",
      });
      mockChatRepo.insertMessage.mockResolvedValue({});
      mockChatRepo.updateRoomLastMessage.mockResolvedValue({});
      mockRealtime.isUserInRoom.mockReturnValue(false); // recipient offline

      const user = { role: "teacher", userId: "teacher1", firstName: "Sara", lastName: "Levi" };
      const res = await chatService.sendMessage(VALID_ROOM_ID, user, "שלום וברכה");

      expect(res.text).toBe("שלום וברכה");
      expect(mockRealtime.emitToRoom).toHaveBeenCalledWith(
        `chat:${VALID_ROOM_ID}`,
        "chat:message",
        expect.objectContaining({ text: "שלום וברכה" }),
      );
      expect(mockRealtime.isUserInRoom).toHaveBeenCalledWith("parent1", `chat:${VALID_ROOM_ID}`);
      expect(mockNotificationService.createMany).toHaveBeenCalledWith(
        ["parent1"],
        expect.objectContaining({
          type: "chat",
          title: "הודעה חדשה מאת Sara Levi",
          body: "שלום וברכה",
          link: `/chat?roomId=${VALID_ROOM_ID}`,
        }),
      );
    });

    test("sends message and skips notification if recipient is currently in the room", async () => {
      mockChatRepo.findRoomById.mockResolvedValue({
        _id: VALID_ROOM_ID,
        teacherUserId: "teacher1",
        parentUserId: "parent1",
      });
      mockChatRepo.insertMessage.mockResolvedValue({});
      mockChatRepo.updateRoomLastMessage.mockResolvedValue({});
      mockRealtime.isUserInRoom.mockReturnValue(true); // recipient in room

      const user = { role: "parent", userId: "parent1" };
      await chatService.sendMessage(VALID_ROOM_ID, user, "תודה רבה");

      expect(mockRealtime.emitToRoom).toHaveBeenCalledWith(`chat:${VALID_ROOM_ID}`, "chat:message", expect.any(Object));
      expect(mockNotificationService.createMany).not.toHaveBeenCalled();
    });
  });

  describe("markRead", () => {
    test("updates room last read and emits chat:read", async () => {
      mockChatRepo.findRoomById.mockResolvedValue({
        _id: VALID_ROOM_ID,
        teacherUserId: "teacher1",
        parentUserId: "parent1",
      });
      mockChatRepo.updateRoomLastRead.mockResolvedValue({});

      const user = { role: "teacher", userId: "teacher1" };
      const res = await chatService.markRead(VALID_ROOM_ID, user);

      expect(res.ok).toBe(true);
      expect(mockChatRepo.updateRoomLastRead).toHaveBeenCalledWith(VALID_ROOM_ID, "teacher", expect.any(Date));
      expect(mockRealtime.emitToRoom).toHaveBeenCalledWith(
        `chat:${VALID_ROOM_ID}`,
        "chat:read",
        expect.objectContaining({
          roomId: VALID_ROOM_ID,
          userId: "teacher1",
        }),
      );
    });
  });
});