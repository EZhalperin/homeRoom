import { jest } from "@jest/globals";
import { AppError } from "../src/utils/AppError.js";

const mockAnnouncementRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  deleteById: jest.fn(),
  list: jest.fn(),
};

const mockClassRepo = {
  findById: jest.fn(),
  findActiveByTeacherId: jest.fn(),
  listActiveClasses: jest.fn(),
};

const mockStudentRepo = {
  findActiveStudentByStudentId: jest.fn(),
  findStudentByUuid: jest.fn(),
  setRiskIndex: jest.fn(),
};

const mockNotificationService = {
  createMany: jest.fn(),
};

const mockRealtime = {
  emitToUser: jest.fn(),
};

jest.unstable_mockModule("../src/repositories/announcementRepository.js", () => mockAnnouncementRepo);
jest.unstable_mockModule("../src/repositories/classRepository.js", () => mockClassRepo);
jest.unstable_mockModule("../src/repositories/studentRepository.js", () => mockStudentRepo);
jest.unstable_mockModule("../src/services/notificationService.js", () => mockNotificationService);
jest.unstable_mockModule("../src/sockets/realtime.js", () => mockRealtime);

const announcementService = await import("../src/services/announcementService.js");
const studentService = await import("../src/services/studentService.js");

describe("announcementService & Realtime Triggers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Announcement creation & audience resolution", () => {
    const adminUser = {
      userId: "admin-id",
      role: "admin",
      firstName: "Admin",
      lastName: "User",
    };

    const teacherUser = {
      userId: "teacher-123",
      role: "teacher",
      firstName: "Sarah",
      lastName: "Teacher",
    };

    test("ADMIN with audience 'all' resolves all active classes, notifies teachers + parents, excludes author", async () => {
      mockClassRepo.listActiveClasses.mockResolvedValueOnce([
        {
          _id: "class-1",
          className: "י'1",
          teacherId: "teacher-1",
          students: [{ studentId: "parent-1" }, { studentId: "parent-2" }],
        },
        {
          _id: "class-2",
          className: "יא'2",
          teacherId: "teacher-2",
          students: [{ studentId: "parent-3" }],
        },
      ]);
      mockAnnouncementRepo.create.mockImplementation(async (doc) => doc);

      const res = await announcementService.createAnnouncement(adminUser, {
        title: "All School Event",
        body: "Everyone is invited",
        audience: { type: "all" },
      });

      expect(res.audience.type).toBe("all");
      expect(mockAnnouncementRepo.create).toHaveBeenCalledTimes(1);

      // Recipients: teacher-1, teacher-2, parent-1, parent-2, parent-3
      expect(mockNotificationService.createMany).toHaveBeenCalledWith(
        expect.arrayContaining(["teacher-1", "teacher-2", "parent-1", "parent-2", "parent-3"]),
        expect.objectContaining({
          type: "announcement",
          title: "הודעה חדשה: All School Event",
        }),
      );
      expect(mockRealtime.emitToUser).toHaveBeenCalledTimes(5);
    });

    test("ADMIN with audience 'grades' filters classes by grade prefix (e.g. י'2 -> י)", async () => {
      mockClassRepo.listActiveClasses.mockResolvedValueOnce([
        {
          _id: "class-1",
          className: "י'1",
          teacherId: "teacher-1",
          students: [{ studentId: "parent-1" }],
        },
        {
          _id: "class-2",
          className: "יא'2",
          teacherId: "teacher-2",
          students: [{ studentId: "parent-2" }],
        },
      ]);
      mockAnnouncementRepo.create.mockImplementation(async (doc) => doc);

      const res = await announcementService.createAnnouncement(adminUser, {
        title: "Tenth Grade Meeting",
        body: "Only for grade 10",
        audience: { type: "grades", grades: ["י"] },
      });

      expect(res.audience.type).toBe("grades");
      expect(res.audience.grades).toEqual(["י"]);
      // Only class-1 matched grade "י"
      expect(mockNotificationService.createMany).toHaveBeenCalledWith(
        ["teacher-1", "parent-1"],
        expect.any(Object),
      );
    });

    test("ADMIN with audience 'classes' rejects inactive or missing class with 400", async () => {
      mockClassRepo.findById.mockResolvedValueOnce({
        _id: "507f1f77bcf86cd799439011",
        isActive: false,
      });

      await expect(
        announcementService.createAnnouncement(adminUser, {
          title: "Specific Class",
          body: "Specific class announcement",
          audience: { type: "classes", classIds: ["507f1f77bcf86cd799439011"] },
        }),
      ).rejects.toThrow(new AppError("Class 507f1f77bcf86cd799439011 not found or inactive", 400));
    });

    test("ADMIN without audience throws 400", async () => {
      await expect(
        announcementService.createAnnouncement(adminUser, {
          title: "No audience",
          body: "Missing audience",
        }),
      ).rejects.toThrow(new AppError("Audience is required for admin announcements", 400));
    });

    test("TEACHER cannot send audience (throws 400 if provided)", async () => {
      await expect(
        announcementService.createAnnouncement(teacherUser, {
          title: "Teacher Attempt",
          body: "Trying to set audience",
          audience: { type: "all" },
        }),
      ).rejects.toThrow(new AppError("Teachers cannot specify an audience", 400));
    });

    test("TEACHER without an active class throws 404", async () => {
      mockClassRepo.findActiveByTeacherId.mockResolvedValueOnce(null);

      await expect(
        announcementService.createAnnouncement(teacherUser, {
          title: "Teacher Note",
          body: "No active class",
        }),
      ).rejects.toThrow(new AppError("Teacher has no active class", 404));
    });

    test("TEACHER with active class automatically targets only the parents of their class", async () => {
      const activeClass = {
        _id: "507f1f77bcf86cd799439012",
        className: "י'3",
        teacherId: "teacher-123",
        students: [{ studentId: "p-1" }, { studentId: "p-2" }],
      };
      mockClassRepo.findActiveByTeacherId.mockResolvedValueOnce(activeClass);
      mockAnnouncementRepo.create.mockImplementation(async (doc) => doc);

      const res = await announcementService.createAnnouncement(teacherUser, {
        title: "Homeroom Update",
        body: "Dear parents, test next week",
      });

      expect(res.audience).toEqual({
        type: "classes",
        grades: [],
        classIds: ["507f1f77bcf86cd799439012"],
      });
      // Notifies only parents of that class; teacher author is NOT in the recipient list
      expect(mockNotificationService.createMany).toHaveBeenCalledWith(
        ["p-1", "p-2"],
        expect.any(Object),
      );
    });
  });

  describe("Announcement visibility / listing", () => {
    test("ADMIN sees all announcements without filter", async () => {
      mockAnnouncementRepo.list.mockResolvedValueOnce([{ title: "Ann 1" }]);
      const res = await announcementService.listAnnouncements({ role: "admin", userId: "admin" });
      expect(mockAnnouncementRepo.list).toHaveBeenCalledWith({ filter: {}, limit: undefined, before: undefined });
      expect(res).toEqual([{ title: "Ann 1" }]);
    });

    test("TEACHER sees authored announcements + announcements targeting their class, grade, or all", async () => {
      mockClassRepo.findActiveByTeacherId.mockResolvedValueOnce({
        _id: "c-10",
        className: "יא'1",
      });
      mockAnnouncementRepo.list.mockResolvedValueOnce([]);

      await announcementService.listAnnouncements({ role: "teacher", userId: "t-10" });

      expect(mockAnnouncementRepo.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            $or: [
              { authorUserId: "t-10" },
              { "audience.type": "all" },
              { "audience.type": "grades", "audience.grades": "יא" },
              { "audience.type": "classes", "audience.classIds": "c-10" },
            ],
          },
        }),
      );
    });

    test("PARENT sees only announcements targeting their child's class, grade, or all", async () => {
      mockStudentRepo.findActiveStudentByStudentId.mockResolvedValueOnce({
        classId: "c-20",
        className: "יב'4",
      });
      mockAnnouncementRepo.list.mockResolvedValueOnce([]);

      await announcementService.listAnnouncements({ role: "parent", userId: "child-nat-id" });

      expect(mockAnnouncementRepo.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            $or: [
              { "audience.type": "all" },
              { "audience.type": "grades", "audience.grades": "יב" },
              { "audience.type": "classes", "audience.classIds": "c-20" },
            ],
          },
        }),
      );
    });
  });

  describe("Announcement deletion authorization", () => {
    test("ADMIN can delete any announcement", async () => {
      mockAnnouncementRepo.findById.mockResolvedValueOnce({ _id: "a-1", authorUserId: "other-user" });
      mockAnnouncementRepo.deleteById.mockResolvedValueOnce(true);

      const res = await announcementService.deleteAnnouncement("a-1", { role: "admin", userId: "admin-1" });
      expect(res.message).toBe("Announcement deleted successfully");
      expect(mockAnnouncementRepo.deleteById).toHaveBeenCalledWith("a-1");
    });

    test("TEACHER can delete their own announcement", async () => {
      mockAnnouncementRepo.findById.mockResolvedValueOnce({ _id: "a-2", authorUserId: "t-1" });
      mockAnnouncementRepo.deleteById.mockResolvedValueOnce(true);

      const res = await announcementService.deleteAnnouncement("a-2", { role: "teacher", userId: "t-1" });
      expect(res.message).toBe("Announcement deleted successfully");
    });

    test("TEACHER cannot delete another teacher's or admin's announcement (throws 403)", async () => {
      mockAnnouncementRepo.findById.mockResolvedValueOnce({ _id: "a-3", authorUserId: "someone-else" });

      await expect(
        announcementService.deleteAnnouncement("a-3", { role: "teacher", userId: "t-1" }),
      ).rejects.toThrow(new AppError("Forbidden", 403));
    });

    test("throws 404 if announcement does not exist", async () => {
      mockAnnouncementRepo.findById.mockResolvedValueOnce(null);

      await expect(
        announcementService.deleteAnnouncement("missing", { role: "admin", userId: "admin-1" }),
      ).rejects.toThrow(new AppError("Announcement not found", 404));
    });
  });

  describe("Risk crossing trigger in studentService.recomputeForStudent", () => {
    test("notifies teacher when risk index crosses WARNING_THRESHOLD upward (e.g. 5.0 -> 7.0+)", async () => {
      const now = Date.now();
      const recentDate1 = new Date(now - 10 * 86400000).toISOString();
      const recentDate2 = new Date(now - 2 * 86400000).toISOString();

      mockStudentRepo.findStudentByUuid.mockResolvedValueOnce({
        teacherId: "teacher-risk-1",
        student: {
          id: "uuid-1",
          firstName: "Dan",
          lastName: "Cohen",
          academicRiskIndex: 5.0, // old index < 6
          grades: [
            { subject: "Math", score: 100, date: recentDate1 },
            { subject: "Math", score: 0, date: recentDate2 },
          ],
          attendance: Array.from({ length: 50 }, () => ({ type: "absence", date: recentDate2 })),
        },
      });
      mockStudentRepo.setRiskIndex.mockResolvedValueOnce();

      const newScore = await studentService.recomputeForStudent("uuid-1");
      expect(newScore).toBeGreaterThanOrEqual(6.0);
      expect(mockNotificationService.createMany).toHaveBeenCalledWith(
        ["teacher-risk-1"],
        expect.objectContaining({
          type: "risk",
          title: expect.stringMatching(/אזהרת סיכון אקדמי|התראת סיכון אקדמי גבוה/),
        }),
      );
    });

    test("does not notify teacher when risk index does NOT cross any threshold upward", async () => {
      mockStudentRepo.findStudentByUuid.mockResolvedValueOnce({
        teacherId: "teacher-risk-2",
        student: {
          id: "uuid-2",
          firstName: "Lea",
          lastName: "Levi",
          academicRiskIndex: 6.0, // already at warning
          // decline stays at 6.0 without crossing alert (8.0)
          grades: [
            { subject: "Math", score: 90, date: new Date().toISOString() },
            { subject: "Math", score: 80, date: new Date().toISOString() },
          ],
          attendance: [],
        },
      });
      mockStudentRepo.setRiskIndex.mockResolvedValueOnce();

      await studentService.recomputeForStudent("uuid-2");
      expect(mockNotificationService.createMany).not.toHaveBeenCalled();
    });
  });
});