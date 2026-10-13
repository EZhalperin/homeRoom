import { calculate, calculateBreakdown, linearSlope } from "../src/services/riskIndexService.js";
import { RISK_CONFIG } from "../src/config/risk.config.js";

describe("riskIndexService (pure math & explainability)", () => {
  const now = new Date("2026-10-15T12:00:00Z");

  describe("Linear Slope Math", () => {
    test("calculates correct slope for linear sequences", () => {
      expect(linearSlope([10, 20, 30])).toBe(10);
      expect(linearSlope([90, 80, 70, 60, 50])).toBe(-10);
      expect(linearSlope([50, 50, 50])).toBe(0);
      expect(linearSlope([100])).toBe(0); // < 2 points
    });
  });

  describe("Worked Examples from Specification", () => {
    test("grades 90,80,70,60,50 on ascending dates, no absences -> 6.0 (warning)", () => {
      const student = {
        grades: [
          { subject: "Math", score: 90, date: "2026-10-01" },
          { subject: "Math", score: 80, date: "2026-10-02" },
          { subject: "Math", score: 70, date: "2026-10-03" },
          { subject: "Math", score: 60, date: "2026-10-04" },
          { subject: "Math", score: 50, date: "2026-10-05" },
        ],
        attendance: [],
      };
      const breakdown = calculateBreakdown(student, now);
      expect(breakdown.index).toBe(6.0);
      expect(breakdown.level).toBe("warning");
      expect(calculate(student, now)).toBe(6.0);
    });

    test("same grades + 6 absences in the window -> 8.0 (alert)", () => {
      const student = {
        grades: [
          { subject: "Math", score: 90, date: "2026-10-01" },
          { subject: "Math", score: 80, date: "2026-10-02" },
          { subject: "Math", score: 70, date: "2026-10-03" },
          { subject: "Math", score: 60, date: "2026-10-04" },
          { subject: "Math", score: 50, date: "2026-10-05" },
        ],
        attendance: [
          { type: "absence", date: "2026-10-06" },
          { type: "absence", date: "2026-10-07" },
          { type: "absence", date: "2026-10-08" },
          { type: "absence", date: "2026-10-09" },
          { type: "absence", date: "2026-10-10" },
          { type: "absence", date: "2026-10-11" },
        ],
      };
      const breakdown = calculateBreakdown(student, now);
      expect(breakdown.index).toBe(8.0);
      expect(breakdown.level).toBe("alert");
      expect(calculate(student, now)).toBe(8.0);
    });

    test("grades 85,82,80,77,75, no absences -> 1.5 (ok)", () => {
      const student = {
        grades: [
          { subject: "Hebrew", score: 85, date: "2026-10-01" },
          { subject: "Hebrew", score: 82, date: "2026-10-02" },
          { subject: "Hebrew", score: 80, date: "2026-10-03" },
          { subject: "Hebrew", score: 77, date: "2026-10-04" },
          { subject: "Hebrew", score: 75, date: "2026-10-05" },
        ],
        attendance: [],
      };
      const breakdown = calculateBreakdown(student, now);
      expect(breakdown.index).toBe(1.5);
      expect(breakdown.level).toBe("ok");
      expect(calculate(student, now)).toBe(1.5);
    });

    test("no data -> 0.0 (ok)", () => {
      const student = { grades: [], attendance: [] };
      const breakdown = calculateBreakdown(student, now);
      expect(breakdown.index).toBe(0.0);
      expect(breakdown.level).toBe("ok");
      expect(calculate(student, now)).toBe(0.0);
    });
  });

  describe("Edge cases & Specific rules", () => {
    test("improving grades contribute 0 to trend", () => {
      const student = {
        grades: [
          { subject: "Math", score: 60, date: "2026-10-01" },
          { subject: "Math", score: 70, date: "2026-10-02" },
          { subject: "Math", score: 80, date: "2026-10-03" },
        ],
      };
      const breakdown = calculateBreakdown(student, now);
      expect(breakdown.trend).toBe(0);
      expect(breakdown.index).toBe(0);
    });

    test("subjects with fewer than 2 grades are ignored in average (not counted as zero)", () => {
      const student = {
        grades: [
          // Single grade in History -> ignored
          { subject: "History", score: 40, date: "2026-10-01" },
          // Declining grades in Math -> full slope of -10
          { subject: "Math", score: 90, date: "2026-10-01" },
          { subject: "Math", score: 80, date: "2026-10-02" },
          { subject: "Math", score: 70, date: "2026-10-03" },
          { subject: "Math", score: 60, date: "2026-10-04" },
          { subject: "Math", score: 50, date: "2026-10-05" },
        ],
      };
      const breakdown = calculateBreakdown(student, now);
      // Trend should be 1.0 (from Math only), not 0.5
      expect(breakdown.trend).toBe(1.0);
      expect(breakdown.index).toBe(6.0);
      expect(breakdown.subjects).toHaveLength(1);
      expect(breakdown.subjects[0].subject).toBe("Math");
    });

    test("uses only the last 5 grades by date regardless of insertion order", () => {
      const student = {
        grades: [
          // Older grades that should be sliced out by slice(-5)
          { subject: "Math", score: 20, date: "2026-09-01" },
          { subject: "Math", score: 30, date: "2026-09-02" },
          // The last 5 grades in shuffled order
          { subject: "Math", score: 50, date: "2026-10-05" },
          { subject: "Math", score: 90, date: "2026-10-01" },
          { subject: "Math", score: 70, date: "2026-10-03" },
          { subject: "Math", score: 80, date: "2026-10-02" },
          { subject: "Math", score: 60, date: "2026-10-04" },
        ],
      };
      const breakdown = calculateBreakdown(student, now);
      // Last 5 by date: 90, 80, 70, 60, 50 -> slope = -10, trend = 1.0
      expect(breakdown.trend).toBe(1.0);
      expect(breakdown.index).toBe(6.0);
    });

    test("lates are weighted 0.5 in attendance ratio", () => {
      // 12 lates = 6 equivalent absences. 6 / 60 / 0.2 = 0.5
      const student = {
        grades: [],
        attendance: Array.from({ length: 12 }, (_, i) => ({
          type: "late",
          date: `2026-10-0${(i % 9) + 1}`,
        })),
      };
      const breakdown = calculateBreakdown(student, now);
      expect(breakdown.absence).toBe(0.5);
      expect(breakdown.index).toBe(2.0); // 10 * 0.4 * 0.5 = 2.0
      expect(breakdown.counts.lates).toBe(12);
      expect(breakdown.counts.absences).toBe(0);
    });

    test("records outside the 60-day window are ignored", () => {
      const student = {
        grades: [],
        attendance: [
          { type: "absence", date: "2026-05-01" }, // > 60 days ago
          { type: "absence", date: "2026-10-25" }, // future
        ],
      };
      const breakdown = calculateBreakdown(student, now);
      expect(breakdown.absence).toBe(0);
      expect(breakdown.index).toBe(0);
    });

    test("clamping and 1-decimal rounding", () => {
      const student = {
        grades: [
          { subject: "Math", score: 100, date: "2026-10-01" },
          { subject: "Math", score: 0, date: "2026-10-02" },
        ],
        attendance: Array.from({ length: 50 }, () => ({
          type: "absence",
          date: "2026-10-05",
        })),
      };
      const breakdown = calculateBreakdown(student, now);
      expect(breakdown.index).toBe(10.0);
    });

    test("calculate() strictly matches calculateBreakdown().index", () => {
      const student = {
        grades: [
          { subject: "Physics", score: 85, date: "2026-10-01" },
          { subject: "Physics", score: 75, date: "2026-10-02" },
        ],
        attendance: [{ type: "absence", date: "2026-10-05" }],
      };
      const breakdown = calculateBreakdown(student, now);
      expect(calculate(student, now)).toBe(breakdown.index);
    });
  });
});