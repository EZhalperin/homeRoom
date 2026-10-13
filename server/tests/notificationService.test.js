import { jest } from "@jest/globals";
import { AppError } from "../src/utils/AppError.js";

const mockNotificationRepo = {
  insertMany: jest.fn(),
  listByUserId: jest.fn(),
  countUnreadByUserId: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
};

const mockRealtime = {
  emitToUser: jest.fn(),
  emitToRoom: jest.fn(),
  disconnectUser: jest.fn(),
  isUserInRoom: jest.fn(),
};

jest.unstable_mockModule("../src/repositories/notificationRepository.js", () => mockNotificationRepo);
jest.unstable_mockModule("../src/sockets/realtime.js", () => mockRealtime);

const notificationService = await import("../src/services/notificationService.js");

describe("notificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createMany", () => {
    test("deduplicates userIds, stores docs, and emits notification:new to each user", async () => {
      mockNotificationRepo.insertMany.mockResolvedValue([]);

      const userIds = ["user1", "user2", "user1", "user3", ""];
      const payload = {
        type: "announcement",
        title: "Test Title",
        body: "Test Body",
        link: "/test",
      };

      const result = await notificationService.createMany(userIds, payload);

      expect(result).toHaveLength(3); // user1, user2, user3
      expect(mockNotificationRepo.insertMany).toHaveBeenCalledTimes(1);
      expect(mockRealtime.emitToUser).toHaveBeenCalledTimes(3);

      expect(mockRealtime.emitToUser).toHaveBeenCalledWith("user1", "notification:new", expect.objectContaining({
        userId: "user1",
        title: "Test Title",
        body: "Test Body",
        readAt: null,
      }));
      expect(mockRealtime.emitToUser).toHaveBeenCalledWith("user2", "notification:new", expect.any(Object));
      expect(mockRealtime.emitToUser).toHaveBeenCalledWith("user3", "notification:new", expect.any(Object));
    });

    test("returns empty array and does not call repository or realtime if userIds is empty", async () => {
      const res = await notificationService.createMany([], { type: "test", title: "t", body: "b" });
      expect(res).toEqual([]);
      expect(mockNotificationRepo.insertMany).not.toHaveBeenCalled();
      expect(mockRealtime.emitToUser).not.toHaveBeenCalled();
    });
  });

  describe("list", () => {
    test("calls repository listByUserId with given parameters", async () => {
      mockNotificationRepo.listByUserId.mockResolvedValue([{ id: "1" }]);
      const res = await notificationService.list("user1", { unreadOnly: true, limit: 10 });
      expect(mockNotificationRepo.listByUserId).toHaveBeenCalledWith("user1", { unreadOnly: true, limit: 10 });
      expect(res).toEqual([{ id: "1" }]);
    });
  });

  describe("unreadCount", () => {
    test("returns unread count object", async () => {
      mockNotificationRepo.countUnreadByUserId.mockResolvedValue(5);
      const res = await notificationService.unreadCount("user1");
      expect(mockNotificationRepo.countUnreadByUserId).toHaveBeenCalledWith("user1");
      expect(res).toEqual({ count: 5 });
    });
  });

  describe("markRead", () => {
    test("returns updated notification doc on success", async () => {
      mockNotificationRepo.markAsRead.mockResolvedValue({ id: "n1", readAt: new Date() });
      const res = await notificationService.markRead("n1", "user1");
      expect(mockNotificationRepo.markAsRead).toHaveBeenCalledWith("n1", "user1");
      expect(res).toHaveProperty("readAt");
    });

    test("throws 404 AppError when notification is not found or not owned", async () => {
      mockNotificationRepo.markAsRead.mockResolvedValue(null);
      await expect(notificationService.markRead("non-existent", "user1")).rejects.toThrow(
        new AppError("Notification not found", 404),
      );
    });
  });

  describe("markAllRead", () => {
    test("marks all as read and returns modified count", async () => {
      mockNotificationRepo.markAllAsRead.mockResolvedValue(7);
      const res = await notificationService.markAllRead("user1");
      expect(mockNotificationRepo.markAllAsRead).toHaveBeenCalledWith("user1");
      expect(res).toEqual({ modifiedCount: 7 });
    });
  });
});