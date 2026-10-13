import { jest } from "@jest/globals";
import { AppError } from "../src/utils/AppError.js";

const mockStudentRepo = {
  findActiveStudentByStudentId: jest.fn(),
};

const mockClassRepo = {
  findActiveByTeacherId: jest.fn(),
  findStudentsByClassId: jest.fn(),
  listActiveClasses: jest.fn(),
};

const mockUserRepo = {
  countUserStats: jest.fn(),
  findManyByUserIds: jest.fn(),
};

jest.unstable_mockModule("../src/repositories/studentRepository.js", () => mockStudentRepo);
jest.unstable_mockModule("../src/repositories/classRepository.js", () => mockClassRepo);
jest.unstable_mockModule("../src/repositories/userRepository.js", () => mockUserRepo);

const analyticsService = await import("../src/services/analyticsService.js");

describe("analyticsService (Stage 3A)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMyChildAnalytics (Parent)", () => {
    test("enforces 5-student privacy threshold: classAverage is null when < 5 students have grades in that subject", async () => {
      mockStudentRepo.findActiveStudentByStudentId.mockResolvedValue({
        classId: "class-123",
        student: {
          id: "child-uuid",
          academicRiskIndex: 4.5,
          grades: [{ subject: "Math", score: 90, weight: 1, date: "2026-10-01" }],
          attendance: [{ type: "absence", date: "2026-10-02" }],
        },
      });

      // Only 4 students in class have grades in Math (< 5 threshold)
      mockClassRepo.findStudentsByClassId.mockResolvedValue([
        { grades: [{ subject: "Math", score: 80, weight: 1 }] },
        { grades: [{ subject: "Math", score: 85, weight: 1 }] },
        { grades: [{ subject: "Math", score: 75, weight: 1 }] },
        { grades: [{ subject: "Math", score: 90, weight: 1 }] },
      ]);

      const res = await analyticsService.getMyChildAnalytics("parent-user", 6);

      expect(res.overallAverage).toBe(90.0);
      expect(res.riskLevel).toBe("ok");
      expect(res.totals).toEqual({ grades: 1, absences: 1, lates: 0 });
      expect(res.subjectAverages).toHaveLength(1);
      expect(res.subjectAverages[0].subject).toBe("Math");
      expect(res.subjectAverages[0].average).toBe(90.0);
      // Privacy threshold check:
      expect(res.subjectAverages[0].classAverage).toBeNull();
    });

    test("computes classAverage when >= 5 students in class have grades in that subject", async () => {
      mockStudentRepo.findActiveStudentByStudentId.mockResolvedValue({
        classId: "class-123",
        student: {
          id: "child-uuid",
          academicRiskIndex: 8.2, // Alert level
          grades: [{ subject: "Hebrew", score: 80, weight: 1, date: "2026-10-01" }],
          attendance: [],
        },
      });

      // 5 students have grades in Hebrew (80, 80, 90, 70, 80 -> mean = 80)
      mockClassRepo.findStudentsByClassId.mockResolvedValue([
        { grades: [{ subject: "Hebrew", score: 80, weight: 1 }] },
        { grades: [{ subject: "Hebrew", score: 80, weight: 1 }] },
        { grades: [{ subject: "Hebrew", score: 90, weight: 1 }] },
        { grades: [{ subject: "Hebrew", score: 70, weight: 1 }] },
        { grades: [{ subject: "Hebrew", score: 80, weight: 1 }] },
      ]);

      const res = await analyticsService.getMyChildAnalytics("parent-user", 6);

      expect(res.riskLevel).toBe("alert");
      expect(res.subjectAverages[0].classAverage).toBe(80.0);
    });

    test("throws 404 if child is not found", async () => {
      mockStudentRepo.findActiveStudentByStudentId.mockResolvedValue(null);

      await expect(
        analyticsService.getMyChildAnalytics("unknown-parent", 6),
      ).rejects.toThrow(new AppError("Student not found", 404));
    });
  });

  describe("getMyClassAnalytics (Teacher)", () => {
    test("throws 404 if teacher has no active class", async () => {
      mockClassRepo.findActiveByTeacherId.mockResolvedValue(null);

      await expect(
        analyticsService.getMyClassAnalytics("teacher-no-class", 6),
      ).rejects.toThrow(new AppError("No active class found", 404));
    });

    test("returns class metrics, distributions, and top atRisk students >= WARNING", async () => {
      mockClassRepo.findActiveByTeacherId.mockResolvedValue({
        _id: "cls-1",
        className: "י'2",
        students: [
          {
            id: "s1",
            firstName: "Dan",
            lastName: "Cohen",
            academicRiskIndex: 8.5,
            grades: [{ subject: "Math", score: 60, weight: 1, date: "2026-10-01" }],
            attendance: [{ type: "absence", date: "2026-10-01" }],
          },
          {
            id: "s2",
            firstName: "Lea",
            lastName: "Levi",
            academicRiskIndex: 6.5,
            grades: [{ subject: "Math", score: 75, weight: 1, date: "2026-10-01" }],
            attendance: [],
          },
          {
            id: "s3",
            firstName: "Ron",
            lastName: "Katz",
            academicRiskIndex: 2.0,
            grades: [{ subject: "Math", score: 95, weight: 1, date: "2026-10-01" }],
            attendance: [],
          },
        ],
      });

      const res = await analyticsService.getMyClassAnalytics("teacher-1", 6);

      expect(res.studentsCount).toBe(3);
      expect(res.classAverage).toBe(76.7); // (60+75+95)/3 = 76.666... -> 76.7
      expect(res.riskDistribution).toEqual({ ok: 1, warning: 1, alert: 1 });
      expect(res.atRisk).toHaveLength(2); // s1 (8.5) and s2 (6.5)
      expect(res.atRisk[0]).toEqual({ id: "s1", name: "Dan Cohen", riskIndex: 8.5 });
      expect(res.atRisk[1]).toEqual({ id: "s2", name: "Lea Levi", riskIndex: 6.5 });
    });
  });

  describe("getSchoolAnalytics (Admin)", () => {
    test("returns school aggregations using count queries for users and one query for classes", async () => {
      mockUserRepo.countUserStats.mockResolvedValue({
        admin: 2,
        teacher: 10,
        parent: 80,
        active: 90,
        suspended: 2,
      });

      mockClassRepo.listActiveClasses.mockResolvedValue([
        {
          _id: "c-1",
          className: "ט'1",
          teacherId: "t-1",
          students: [
            {
              id: "st-1",
              academicRiskIndex: 3.0,
              grades: [{ subject: "Math", score: 85, weight: 1, date: "2026-10-01" }],
              attendance: [{ type: "absence", date: "2026-10-02" }],
            },
          ],
        },
      ]);

      mockUserRepo.findManyByUserIds.mockResolvedValue([
        { userId: "t-1", firstName: "Sara", lastName: "Shalit" },
      ]);

      const res = await analyticsService.getSchoolAnalytics(6);

      expect(mockUserRepo.countUserStats).toHaveBeenCalledTimes(1);
      expect(res.totals.users).toEqual({
        admin: 2,
        teacher: 10,
        parent: 80,
        active: 90,
        suspended: 2,
      });
      expect(res.totals.classes).toBe(1);
      expect(res.totals.students).toBe(1);
      expect(res.classes).toHaveLength(1);
      expect(res.classes[0].teacherName).toBe("Sara Shalit");
      expect(res.classes[0].absencesPerStudent).toBe(1.0);
    });
  });
});