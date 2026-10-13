import { calculate } from "../src/services/riskIndexService.js";
import { RISK_CONFIG } from "../src/config/risk.config.js";

describe("riskIndexService.calculate (pure math)", () => {
  const now = new Date("2026-10-15T12:00:00Z");

  test("returns 0 for student with no grades and no attendance", () => {
    const student = { grades: [], attendance: [] };
    const score = calculate(student, now);
    expect(score).toBe(0);
  });

  describe("decline-only trend", () => {
    test("improving grades contribute 0 to trend component", () => {
      // Grades improving over time: 70 -> 80 -> 90 -> 100
      const student = {
        grades: [
          { subject: "Math", score: 70, date: "2026-10-01" },
          { subject: "Math", score: 80, date: "2026-10-05" },
          { subject: "Math", score: 90, date: "2026-10-10" },
          { subject: "Math", score: 100, date: "2026-10-14" },
        ],
        attendance: [],
      };
      const score = calculate(student, now);
      expect(score).toBe(0);
    });

    test("flat grades contribute 0 to trend component", () => {
      const student = {
        grades: [
          { subject: "Math", score: 85, date: "2026-10-01" },
          { subject: "Math", score: 85, date: "2026-10-05" },
          { subject: "Math", score: 85, date: "2026-10-10" },
        ],
        attendance: [],
      };
      expect(calculate(student, now)).toBe(0);
    });

    test("declining grades increase the risk index", () => {
      // Steep decline: 100 -> 80 -> 60 -> 40
      const student = {
        grades: [
          { subject: "Math", score: 100, date: "2026-10-01" },
          { subject: "Math", score: 80, date: "2026-10-05" },
          { subject: "Math", score: 60, date: "2026-10-10" },
          { subject: "Math", score: 40, date: "2026-10-14" },
        ],
        attendance: [],
      };
      const score = calculate(student, now);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("absence ratio", () => {
    test("calculates absences and lates (with 0.5 weight) within window", () => {
      // window is 60 days
      const student = {
        grades: [],
        attendance: [
          { type: "absence", date: "2026-10-10" }, // within window
          { type: "absence", date: "2026-10-08" }, // within window
          { type: "late", date: "2026-10-05" },    // within window (0.5)
          { type: "absence", date: "2026-05-01" }, // older than 60 days -> ignored
        ],
      };
      // absences = 2, lates = 1 -> 2 + 0.5*1 = 2.5
      // ratio = 2.5 / 60
      // raw = 10 * (0.6*0 + 0.4*(2.5/60)) = 10 * 0.4 * 0.041666... = 0.1666... -> rounded to 0.2
      const score = calculate(student, now);
      expect(score).toBe(0.2);
    });

    test("ignores attendance records occurring in the future relative to now", () => {
      const student = {
        grades: [],
        attendance: [
          { type: "absence", date: "2026-10-20" }, // future
        ],
      };
      expect(calculate(student, now)).toBe(0);
    });
  });

  describe("clamping and rounding", () => {
    test("clamps maximum risk index to 10.0 even with catastrophic metrics", () => {
      // 100 absences in 60 days + huge grade drops
      const student = {
        grades: [
          { subject: "Math", score: 100, date: "2026-10-01" },
          { subject: "Math", score: 0, date: "2026-10-05" },
        ],
        attendance: Array.from({ length: 100 }, () => ({
          type: "absence",
          date: "2026-10-10",
        })),
      };
      const score = calculate(student, now);
      expect(score).toBe(10);
    });

    test("clamps minimum risk index to 0.0", () => {
      const student = { grades: [], attendance: [] };
      expect(calculate(student, now)).toBe(0);
    });
  });
});