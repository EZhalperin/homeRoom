import { RISK_CONFIG } from "../config/risk.config.js";

/**
 * Pure academic-risk calculation. Thresholds live in `risk.config.js`.
 * @module services/riskIndexService
 */

/**
 * Ordinary-least-squares slope of `ys` against x = 0..n-1.
 * @param {number[]} ys
 * @returns {number}
 */
function linearSlope(ys) {
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
 * Decline-only trend in 0..1, averaged across subjects.
 * Positive slopes (improvement) contribute 0. A slope of -100 over one step → 1.
 *
 * @param {Array<{subject: string, score: number, date: Date|string}>} grades
 * @param {number} nWindow
 * @returns {number}
 */
function trendComponent(grades, nWindow) {
  if (!Array.isArray(grades) || grades.length === 0) {
    return 0;
  }

  /** @type {Map<string, Array<{ score: number, date: number }>>} */
  const bySubject = new Map();
  for (const grade of grades) {
    if (!grade || typeof grade.subject !== "string") {
      continue;
    }
    const score = Number(grade.score);
    const date = new Date(grade.date).getTime();
    if (!Number.isFinite(score) || !Number.isFinite(date)) {
      continue;
    }
    const list = bySubject.get(grade.subject) || [];
    list.push({ score, date });
    bySubject.set(grade.subject, list);
  }

  if (bySubject.size === 0) {
    return 0;
  }

  let total = 0;
  for (const list of bySubject.values()) {
    list.sort((a, b) => a.date - b.date);
    const recent = list.slice(-nWindow).map((g) => g.score);
    const slope = linearSlope(recent);
    const decline = slope >= 0 ? 0 : Math.min(1, -slope / 100);
    total += decline;
  }

  return total / bySubject.size;
}

/**
 * (absences + 0.5 * lates) / windowDays, clamped to 0..1, using records inside the window.
 *
 * @param {Array<{date: Date|string, type: string}>} attendance
 * @param {Date} now
 * @param {number} windowDays
 * @returns {number}
 */
function absenceComponent(attendance, now, windowDays) {
  if (!windowDays || windowDays <= 0) {
    return 0;
  }
  const from = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  let absences = 0;
  let lates = 0;
  for (const record of attendance || []) {
    const date = new Date(record.date);
    if (Number.isNaN(date.getTime()) || date < from || date > now) {
      continue;
    }
    if (record.type === "absence") {
      absences += 1;
    } else if (record.type === "late") {
      lates += 1;
    }
  }
  return Math.min(1, Math.max(0, (absences + 0.5 * lates) / windowDays));
}

/**
 * Academic risk index in 0.0..10.0 (one decimal).
 *
 * @param {{ grades?: unknown[], attendance?: unknown[] }} student
 * @param {Date} [now]
 * @param {typeof RISK_CONFIG} [config]
 * @returns {number}
 */
export function calculate(student, now = new Date(), config = RISK_CONFIG) {
  const trend = trendComponent(student?.grades || [], config.N);
  const absence = absenceComponent(student?.attendance || [], now, config.window);
  const raw = 10 * (config.weights.trend * trend + config.weights.absence * absence);
  const rounded = Math.round(raw * 10) / 10;
  return Math.min(10, Math.max(0, rounded));
}

export default { calculate };
