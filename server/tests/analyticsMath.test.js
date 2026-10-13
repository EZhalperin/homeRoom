import {
  getUtcMonthRange,
  toUtcYearMonth,
  calculateSubjectAverages,
  calculateOverallAverage,
  monthlyTrend,
  attendanceByMonth,
  gradeDistribution,
  riskDistribution,
} from "../src/services/analyticsMath.js";

describe("analyticsMath (Pure Math & Aggregations)", () => {
  const refDate = new Date("2026-10-15T12:00:00Z");

  describe("getUtcMonthRange & toUtcYearMonth", () => {
    test("generates correct ascending UTC months array", () => {
      const months = getUtcMonthRange(6, refDate);
      expect(months).toEqual([
        "2026-05",
        "2026-06",
        "2026-07",
        "2026-08",
        "2026-09",
        "2026-10",
      ]);
    });

    test("clamps month range between 1 and 12", () => {
      expect(getUtcMonthRange(0, refDate)).toHaveLength(1);
      expect(getUtcMonthRange(20, refDate)).toHaveLength(12);
    });

    test("formats date to YYYY-MM correctly", () => {
      expect(toUtcYearMonth("2026-03-15T10:00:00Z")).toBe("2026-03");
      expect(toUtcYearMonth(null)).toBeNull();
      expect(toUtcYearMonth("invalid-date")).toBeNull();
    });
  });

  describe("calculateSubjectAverages & calculateOverallAverage", () => {
    test("calculates weighted subject averages", () => {
      const grades = [
        { subject: "Math", score: 90, weight: 2 },
        { subject: "Math", score: 80, weight: 1 },
        { subject: "English", score: 100, weight: 1 },
      ];
      // Math: (90*2 + 80*1)/3 = 260/3 = 86.666... -> 86.7
      const subjectAvgs = calculateSubjectAverages(grades);
      expect(subjectAvgs).toEqual([
        { subject: "Math", average: 86.7 },
        { subject: "English", average: 100 },
      ]);
    });

    test("calculates overall average as the mean of per-subject weighted averages", () => {
      const grades = [
        { subject: "Math", score: 90, weight: 2 },
        { subject: "Math", score: 80, weight: 1 },
        { subject: "English", score: 100, weight: 1 },
      ];
      // mean of Math (86.666...) and English (100) = 186.666... / 2 = 93.333... -> 93.3
      const overall = calculateOverallAverage(grades);
      expect(overall).toBe(93.3);
    });

    test("returns null / empty when grades array is empty or invalid", () => {
      expect(calculateSubjectAverages([])).toEqual([]);
      expect(calculateOverallAverage([])).toBeNull();
      expect(calculateOverallAverage(null)).toBeNull();
    });
  });

  describe("monthlyTrend", () => {
    test("aggregates monthly average grade with null for missing months", () => {
      const grades = [
        { score: 80, weight: 1, date: "2026-05-10" },
        { score: 90, weight: 1, date: "2026-05-20" }, // May avg = 85
        { score: 95, weight: 1, date: "2026-10-05" }, // Oct avg = 95
      ];
      const trend = monthlyTrend(grades, 6, refDate);

      expect(trend).toHaveLength(6);
      expect(trend[0]).toEqual({ month: "2026-05", average: 85.0 });
      expect(trend[1]).toEqual({ month: "2026-06", average: null });
      expect(trend[2]).toEqual({ month: "2026-07", average: null });
      expect(trend[3]).toEqual({ month: "2026-08", average: null });
      expect(trend[4]).toEqual({ month: "2026-09", average: null });
      expect(trend[5]).toEqual({ month: "2026-10", average: 95.0 });
    });
  });

  describe("attendanceByMonth", () => {
    test("counts absences and lates zero-filled for each month", () => {
      const attendance = [
        { type: "absence", date: "2026-05-10" },
        { type: "late", date: "2026-05-15" },
        { type: "absence", date: "2026-10-02" },
      ];
      const res = attendanceByMonth(attendance, 6, refDate);

      expect(res).toHaveLength(6);
      expect(res[0]).toEqual({ month: "2026-05", absences: 1, lates: 1 });
      expect(res[1]).toEqual({ month: "2026-06", absences: 0, lates: 0 });
      expect(res[5]).toEqual({ month: "2026-10", absences: 1, lates: 0 });
    });
  });

  describe("gradeDistribution", () => {
    test("places student overall averages into correct buckets", () => {
      const averages = [45, 59.9, 60, 65, 75, 80, 89, 90, 95, null];
      const dist = gradeDistribution(averages);

      expect(dist).toEqual([
        { bucket: "0-59", count: 2 }, // 45, 59.9
        { bucket: "60-69", count: 2 }, // 60, 65
        { bucket: "70-79", count: 1 }, // 75
        { bucket: "80-89", count: 2 }, // 80, 89
        { bucket: "90-100", count: 2 }, // 90, 95
      ]);
    });
  });

  describe("riskDistribution", () => {
    test("counts students by config thresholds", () => {
      const students = [
        { academicRiskIndex: 2.0 },
        { academicRiskIndex: 5.9 },
        { academicRiskIndex: 6.0 },
        { academicRiskIndex: 7.9 },
        { academicRiskIndex: 8.0 },
        { academicRiskIndex: 9.5 },
      ];
      const dist = riskDistribution(students);
      expect(dist).toEqual({
        ok: 2,
        warning: 2,
        alert: 2,
      });
    });
  });
});