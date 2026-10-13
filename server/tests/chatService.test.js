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

const mockUserRepo = {
  findManyByUserIds: jest.fn().mockResolvedValue([]),
};

const mockRealtime = {
  emitToUser: jest.fn(),
  emitToRoom: jest.fn(),
  disconnectUser: jest.fn(),
  isUserInRoom: jest.fn(),
};

jest.unstable_mockModule("../src/repositories/chatRepository.js", () => mockChatRepo);
jest.unstable_mockModule("../src/repositories/studentRepository.js", () => mockStudentRepo);
jest.unstable_mockModule("../src/repositories/userRepository.js", () => mockUserRepo);
jest.unstable_mockModule("../src/services/studentService.js", () => mockStudentService);
jest.unstable_mockModule("../src/services/notificationService.js", () => mockNotificationService);
jest.unstable_mockModule("../src/sockets/realtime.js", () => mockRealtime);

const chatService = await import("../src/services/chatService.js");

describe("chatService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    test("teacher without studentUuid throws 400", async () => {
      await expect(
        chatService.getOrCreateRoom({ role: "teacher", userId: "teacher1" }, {}),
      ).rejects.toThrow(new AppError("studentUuid is required for teachers", 400));
    });

    test("parent without active class throws 404", async () => {
      mockStudentRepo.findActiveStudentByStudentId.mockResolvedValue(null);

      await expect(
        chatService.getOrCreateRoom({ role: "parent", userId: "parent1" }),
      ).rejects.toThrow(new AppError("No active class or teacher found for your child", 404));
    });

    test("admin throws 403", async () => {
      await expect(
        chatService.getOrCreateRoom({ role: "admin", userId: "admin1" }),
      ).rejects.toThrow(new AppError("Forbidden", 403));
    });
  });

  describe("listRooms", () => {
    test("returns rooms with unreadCount and teacherName for user", async () => {
      mockChatRepo.listRoomsForUser.mockResolvedValue([
        { _id: "r1", teacherUserId: "t1", parentUserId: "p1", studentUuid: "s1" },
        { _id: "r2", teacherUserId: "t1", parentUserId: "p2", studentUuid: "s2" },
      ]);
      mockChatRepo.countUnreadMessages.mockResolvedValue(2);
      mockUserRepo.findManyByUserIds.mockResolvedValueOnce([
        { userId: "t1", firstName: "Alice", lastName: "Smith" },
      ]);

      const res = await chatService.listRooms({ role: "teacher", userId: "t1" });

      expect(res).toHaveLength(2);
      expect(res[0].unreadCount).toBe(2);
      expect(res[0].teacherName).toBe("Alice Smith");
    });
  });

  describe("sendMessage", () => {
    test("sends message and triggers notification and realtime event to recipient", async () => {
      const room = {
        _id: VALID_ROOM_ID,
        teacherUserId: "teacher1",
        parentUserId: "parent1",
        studentName: "Dan Cohen",
      };
      mockChatRepo.findRoomById.mockResolvedValue(room);
      mockChatRepo.insertMessage.mockImplementation(async (msg) => ({ ...msg, _id: "msg1" }));
      mockChatRepo.updateRoomLastMessage.mockResolvedValue();
      mockRealtime.isUserInRoom.mockReturnValue(false); // recipient not active in room

      const res = await chatService.sendMessage(
        VALID_ROOM_ID,
        { role: "teacher", userId: "teacher1" },
        "Hello parent",
      );

      expect(res.text).toBe("Hello parent");
      expect(mockChatRepo.updateRoomLastMessage).toHaveBeenCalled();
      expect(mockRealtime.emitToRoom).toHaveBeenCalledWith(
        `chat:${VALID_ROOM_ID}`,
        "chat:message",
        expect.any(Object),
      );
      // Recipient is parent1 -> notified
      expect(mockNotificationService.createMany).toHaveBeenCalledWith(
        ["parent1"],
        expect.objectContaining({ type: "chat" }),
      );
    });

    test("throws 403 if sender is neither teacher nor parent of the room", async () => {
      mockChatRepo.findRoomById.mockResolvedValue({
        _id: VALID_ROOM_ID,
        teacherUserId: "teacher1",
        parentUserId: "parent1",
      });

      await expect(
        chatService.sendMessage(
          VALID_ROOM_ID,
          { role: "teacher", userId: "intruder_teacher" },
          "Sneaky note",
        ),
      ).rejects.toThrow(new AppError("Forbidden", 403));
    });
  });

  describe("markRead", () => {
    test("marks room read for participating user", async () => {
      mockChatRepo.findRoomById.mockResolvedValue({
        _id: VALID_ROOM_ID,
        teacherUserId: "teacher1",
        parentUserId: "parent1",
      });
      mockChatRepo.updateRoomLastRead.mockResolvedValue();

      const res = await chatService.markRead(VALID_ROOM_ID, { role: "parent", userId: "parent1" });
      expect(res.ok).toBe(true);
      expect(mockChatRepo.updateRoomLastRead).toHaveBeenCalledWith(VALID_ROOM_ID, "parent", expect.any(Date));
    });
  });
});