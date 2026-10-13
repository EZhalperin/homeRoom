import { weightedAverage } from "../src/services/gradeService.js";

describe("gradeService.weightedAverage (pure math)", () => {
  test("returns null for empty array or non-array", () => {
    expect(weightedAverage([])).toBeNull();
    expect(weightedAverage(null)).toBeNull();
    expect(weightedAverage(undefined)).toBeNull();
  });

  test("correctly calculates weighted average dividing by sum of weights", () => {
    const grades = [
      { subject: "Math", score: 80, weight: 2 },
      { subject: "Math", score: 90, weight: 3 },
    ];
    // (80*2 + 90*3) / (2 + 3) = (160 + 270) / 5 = 430 / 5 = 86
    const result = weightedAverage(grades);
    expect(result).toEqual({ Math: 86 });
  });

  test("calculates separate averages per subject", () => {
    const grades = [
      { subject: "Math", score: 100, weight: 0.5 },
      { subject: "Math", score: 80, weight: 0.5 },
      { subject: "English", score: 70, weight: 1 },
      { subject: "English", score: 90, weight: 1 },
    ];
    const result = weightedAverage(grades);
    expect(result).toEqual({
      Math: 90,
      English: 80,
    });
  });

  test("skips invalid entries, non-finite scores and weights", () => {
    const grades = [
      null,
      { subject: 123, score: 80, weight: 1 },
      { subject: "History", score: "not-a-number", weight: 1 },
      { subject: "History", score: 85, weight: "bad-weight" },
      { subject: "History", score: 95, weight: 1 },
    ];
    const result = weightedAverage(grades);
    expect(result).toEqual({ History: 95 });
  });

  test("handles zero total weight gracefully", () => {
    const grades = [
      { subject: "Art", score: 100, weight: 0 },
    ];
    const result = weightedAverage(grades);
    expect(result).toEqual({ Art: 0 });
  });
});