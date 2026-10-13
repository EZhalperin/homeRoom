import { jest } from "@jest/globals";
import { AppError } from "../src/utils/AppError.js";

const mockStudentRepo = {
  findActiveStudentByStudentId: jest.fn(),
};

const mockUserRepo = {
  findManyByUserIds: jest.fn(),
};

const mockClassRepo = {
  list: jest.fn(),
};

jest.unstable_mockModule("../src/repositories/studentRepository.js", () => mockStudentRepo);
jest.unstable_mockModule("../src/repositories/userRepository.js", () => mockUserRepo);
jest.unstable_mockModule("../src/repositories/classRepository.js", () => mockClassRepo);

const studentService = await import("../src/services/studentService.js");
const classService = await import("../src/services/classService.js");

describe("Teacher and Class Resolution (Stage F4)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("studentService.getMyChild", () => {
    test("returns className and resolved teacher firstName/lastName", async () => {
      mockStudentRepo.findActiveStudentByStudentId.mockResolvedValueOnce({
        className: "י'2",
        teacherId: "teacher-99",
        student: {
          id: "student-uuid-1",
          firstName: "Ron",
          lastName: "Cohen",
          grades: [],
          attendance: [],
          forms: [],
        },
      });

      mockUserRepo.findManyByUserIds.mockResolvedValueOnce([
        { userId: "teacher-99", firstName: "Sara", lastName: "Levi" },
      ]);

      const result = await studentService.getMyChild("parent-user-id");

      expect(mockUserRepo.findManyByUserIds).toHaveBeenCalledWith(["teacher-99"]);
      expect(result.className).toBe("י'2");
      expect(result.teacher).toEqual({ firstName: "Sara", lastName: "Levi" });
      expect(result.id).toBe("student-uuid-1");
    });

    test("returns teacher: null if teacher does not exist in user repository", async () => {
      mockStudentRepo.findActiveStudentByStudentId.mockResolvedValueOnce({
        className: "יא'1",
        teacherId: "deleted-teacher-id",
        student: {
          id: "student-uuid-2",
          firstName: "Dan",
          lastName: "Katz",
          grades: [],
        },
      });

      mockUserRepo.findManyByUserIds.mockResolvedValueOnce([]);

      const result = await studentService.getMyChild("parent-user-id");

      expect(result.className).toBe("יא'1");
      expect(result.teacher).toBeNull();
    });
  });

  describe("classService.listClasses batched teacher lookup", () => {
    test("calls findManyByUserIds exactly once for all classes and attaches teacherName", async () => {
      mockClassRepo.list.mockResolvedValueOnce([
        { _id: "c1", className: "י'1", teacherId: "t1", students: [{}, {}] },
        { _id: "c2", className: "י'2", teacherId: "t2", students: [{}] },
        { _id: "c3", className: "י'3", teacherId: "t1", students: [] },
      ]);

      mockUserRepo.findManyByUserIds.mockResolvedValueOnce([
        { userId: "t1", firstName: "Alice", lastName: "Smith" },
        { userId: "t2", firstName: "Bob", lastName: "Brown" },
      ]);

      const result = await classService.listClasses({ role: "admin", userId: "admin1" });

      expect(mockUserRepo.findManyByUserIds).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.findManyByUserIds).toHaveBeenCalledWith(expect.arrayContaining(["t1", "t2"]));
      expect(result).toHaveLength(3);
      expect(result[0].teacherName).toBe("Alice Smith");
      expect(result[0].studentsCount).toBe(2);
      expect(result[1].teacherName).toBe("Bob Brown");
      expect(result[1].studentsCount).toBe(1);
      expect(result[2].teacherName).toBe("Alice Smith");
      expect(result[2].studentsCount).toBe(0);
    });
  });
});