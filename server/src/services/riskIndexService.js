import { RISK_CONFIG } from "../config/risk.config.js";

/**
 * Pure academic-risk calculation. Thresholds live in `risk.config.js`.
 * @module services/riskIndexService
 */

/**
 * Clamps number between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/**
 * Ordinary-least-squares slope of `ys` against x = 0..n-1.
 * @param {number[]} ys
 * @returns {number}
 */
export function linearSlope(ys) {
  const n = ys.length;
  if (n < 2) {
    return 0;
  }
  const meanX = (n - 1) / 2;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = i - meanX;
    numerator += dx * (ys[i] - meanY);
    denominator += dx * dx;
  }
  if (denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

/**
 * Calculates detailed breakdown of the academic risk index.
 * Single source of truth for both the numeric index and the explanation breakdown.
 *
 * @param {{ grades?: Array<{subject: string, score: number, date: Date|string}>, attendance?: Array<{date: Date|string, type: string}> }} student
 * @param {Date} [now]
 * @param {typeof RISK_CONFIG} [config]
 * @returns {{
 *   index: number,
 *   trend: number,
 *   absence: number,
 *   level: 'ok'|'warning'|'alert',
 *   components: { trendPoints: number, absencePoints: number },
 *   subjects: Array<{ subject: string, slope: number, decline: number }>,
 *   counts: { absences: number, lates: number, windowDays: number }
 * }}
 */
export function calculateBreakdown(student, now = new Date(), config = RISK_CONFIG) {
  const nWindow = config.N || 5;
  const windowDays = config.window || 60;
  const trendFullSlope = config.TREND_FULL_SLOPE || 10;
  const absenceFullRatio = config.ABSENCE_FULL_RATIO || 0.2;
  const weights = config.weights || { trend: 0.6, absence: 0.4 };
  const warningThreshold = config.WARNING_THRESHOLD ?? 6;
  const alertThreshold = config.ALERT_THRESHOLD ?? 8;

  // 1. Per-subject trend
  const rawGrades = Array.isArray(student?.grades) ? student.grades : [];
  const bySubject = new Map();
  for (const grade of rawGrades) {
    if (!grade || typeof grade.subject !== "string") continue;
    const score = Number(grade.score);
    const date = new Date(grade.date).getTime();
    if (!Number.isFinite(score) || !Number.isFinite(date)) continue;

    const list = bySubject.get(grade.subject) || [];
    list.push({ score, date });
    bySubject.set(grade.subject, list);
  }

  const subjects = [];
  let totalDecline = 0;
  let qualifyingCount = 0;

  for (const [subject, list] of bySubject.entries()) {
    // A subject needs >= 2 grades to count; subjects with fewer are ignored in the average
    if (list.length < 2) continue;

    list.sort((a, b) => a.date - b.date);
    const recentScores = list.slice(-nWindow).map((g) => g.score);
    if (recentScores.length < 2) continue;

    const slope = linearSlope(recentScores);
    // Positive slopes (improvement) contribute 0. Declines are clamped against TREND_FULL_SLOPE.
    const decline = slope >= 0 ? 0 : clamp(-slope / trendFullSlope, 0, 1);

    qualifyingCount += 1;
    totalDecline += decline;

    subjects.push({
      subject,
      slope: Math.round(slope * 100) / 100,
      decline: Math.round(decline * 1000) / 1000,
    });
  }

  const trend = qualifyingCount > 0 ? totalDecline / qualifyingCount : 0;

  // 2. Attendance component in last window days
  const rawAttendance = Array.isArray(student?.attendance) ? student.attendance : [];
  const fromTime = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  let absences = 0;
  let lates = 0;

  for (const record of rawAttendance) {
    if (!record || !record.date) continue;
    const recordTime = new Date(record.date).getTime();
    if (Number.isNaN(recordTime) || recordTime < fromTime || recordTime > now.getTime()) {
      continue;
    }
    if (record.type === "absence") {
      absences += 1;
    } else if (record.type === "late") {
      lates += 1;
    }
  }

  const weightedAbsenceCount = absences + 0.5 * lates;
  const absenceRatio = windowDays > 0 ? weightedAbsenceCount / windowDays : 0;
  const absence = clamp(absenceRatio / absenceFullRatio, 0, 1);

  // 3. Raw index and clamping
  const rawIndex = 10 * (weights.trend * trend + weights.absence * absence);
  const index = clamp(Math.round(rawIndex * 10) / 10, 0, 10);

  // 4. Level
  let level = "ok";
  if (index >= alertThreshold) {
    level = "alert";
  } else if (index >= warningThreshold) {
    level = "warning";
  }

  // 5. Component points
  const trendPoints = Math.round(10 * weights.trend * trend * 10) / 10;
  const absencePoints = Math.round(10 * weights.absence * absence * 10) / 10;

  return {
    index,
    trend: Math.round(trend * 1000) / 1000,
    absence: Math.round(absence * 1000) / 1000,
    level,
    components: {
      trendPoints,
      absencePoints,
    },
    subjects,
    counts: {
      absences,
      lates,
      windowDays,
    },
  };
}

/**
 * Academic risk index in 0.0..10.0 (one decimal).
 * Single source of truth delegates to calculateBreakdown().
 *
 * @param {{ grades?: unknown[], attendance?: unknown[] }} student
 * @param {Date} [now]
 * @param {typeof RISK_CONFIG} [config]
 * @returns {number}
 */
export function calculate(student, now = new Date(), config = RISK_CONFIG) {
  return calculateBreakdown(student, now, config).index;
}

export default { calculate, calculateBreakdown, linearSlope };