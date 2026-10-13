import { weightedAverage } from "./gradeService.js";
import { RISK_CONFIG } from "../config/risk.config.js";

/**
 * Pure math and aggregation helpers for analytics.
 * Zero database calls; fully unit-testable.
 * @module services/analyticsMath
 */

/**
 * Returns ascending list of UTC 'YYYY-MM' strings for the last N months ending at `now`.
 * @param {number} monthsCount
 * @param {Date} [now]
 * @returns {string[]}
 */
export function getUtcMonthRange(monthsCount = 6, now = new Date()) {
  const count = Math.min(12, Math.max(1, monthsCount));
  const months = [];
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(year, month - i, 1));
    const yStr = d.getUTCFullYear();
    const mStr = String(d.getUTCMonth() + 1).padStart(2, "0");
    months.push(`${yStr}-${mStr}`);
  }

  return months;
}

/**
 * Extracts UTC 'YYYY-MM' from a date string/object.
 * @param {string|Date} dateVal
 * @returns {string|null}
 */
export function toUtcYearMonth(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return null;
  const yStr = d.getUTCFullYear();
  const mStr = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yStr}-${mStr}`;
}

/**
 * Computes per-subject averages from a list of grades.
 * Reuses `gradeService.weightedAverage`.
 * @param {Array<{ subject: string, score: number, weight?: number }>} grades
 * @returns {Array<{ subject: string, average: number }>}
 */
export function calculateSubjectAverages(grades) {
  const avgMap = weightedAverage(grades);
  if (!avgMap) return [];
  return Object.entries(avgMap).map(([subject, avg]) => ({
    subject,
    average: Math.round(avg * 10) / 10,
  }));
}

/**
 * Computes overall average as the mean of per-subject weighted averages.
 * Returns null if no grades.
 * @param {Array<{ subject: string, score: number, weight?: number }>} grades
 * @returns {number|null}
 */
export function calculateOverallAverage(grades) {
  const avgMap = weightedAverage(grades);
  if (!avgMap) return null;
  const values = Object.values(avgMap);
  if (values.length === 0) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(mean * 10) / 10;
}

/**
 * Computes monthly average grade trend over the specified months window.
 * Missing months are included with average: null.
 * @param {Array<{ score: number, weight?: number, date: string|Date }>} grades
 * @param {number} [monthsCount=6]
 * @param {Date} [now]
 * @returns {Array<{ month: string, average: number|null }>}
 */
export function monthlyTrend(grades = [], monthsCount = 6, now = new Date()) {
  const months = getUtcMonthRange(monthsCount, now);
  const byMonth = new Map();
  for (const m of months) {
    byMonth.set(m, { weightedSum: 0, weightSum: 0 });
  }

  for (const g of grades || []) {
    const ym = toUtcYearMonth(g.date);
    if (ym && byMonth.has(ym)) {
      const score = Number(g.score);
      const weight = Number(g.weight ?? 1);
      if (Number.isFinite(score) && Number.isFinite(weight)) {
        const item = byMonth.get(ym);
        item.weightedSum += score * weight;
        item.weightSum += weight;
      }
    }
  }

  return months.map((m) => {
    const item = byMonth.get(m);
    const avg = item && item.weightSum > 0 ? Math.round((item.weightedSum / item.weightSum) * 10) / 10 : null;
    return { month: m, average: avg };
  });
}

/**
 * Computes monthly attendance counts (absences and lates) over the specified months window.
 * Zero-filled for all months in range.
 * @param {Array<{ type: string, date: string|Date }>} attendance
 * @param {number} [monthsCount=6]
 * @param {Date} [now]
 * @returns {Array<{ month: string, absences: number, lates: number }>}
 */
export function attendanceByMonth(attendance = [], monthsCount = 6, now = new Date()) {
  const months = getUtcMonthRange(monthsCount, now);
  const byMonth = new Map();
  for (const m of months) {
    byMonth.set(m, { absences: 0, lates: 0 });
  }

  for (const a of attendance || []) {
    const ym = toUtcYearMonth(a.date);
    if (ym && byMonth.has(ym)) {
      const item = byMonth.get(ym);
      if (a.type === "absence") {
        item.absences += 1;
      } else if (a.type === "late") {
        item.lates += 1;
      }
    }
  }

  return months.map((m) => {
    const item = byMonth.get(m) || { absences: 0, lates: 0 };
    return { month: m, absences: item.absences, lates: item.lates };
  });
}

/**
 * Buckets overall averages into 0-59, 60-69, 70-79, 80-89, 90-100.
 * Excludes null/undefined values.
 * @param {Array<number|null|undefined>} averages
 * @returns {Array<{ bucket: string, count: number }>}
 */
export function gradeDistribution(averages = []) {
  const buckets = [
    { bucket: "0-59", count: 0 },
    { bucket: "60-69", count: 0 },
    { bucket: "70-79", count: 0 },
    { bucket: "80-89", count: 0 },
    { bucket: "90-100", count: 0 },
  ];

  for (const avg of averages) {
    if (avg === null || avg === undefined || !Number.isFinite(avg)) continue;
    if (avg < 60) buckets[0].count += 1;
    else if (avg < 70) buckets[1].count += 1;
    else if (avg < 80) buckets[2].count += 1;
    else if (avg < 90) buckets[3].count += 1;
    else buckets[4].count += 1;
  }

  return buckets;
}

/**
 * Counts students by risk level: ok, warning, alert.
 * @param {Array<{ academicRiskIndex?: number }>} students
 * @param {typeof RISK_CONFIG} [config]
 * @returns {{ ok: number, warning: number, alert: number }}
 */
export function riskDistribution(students = [], config = RISK_CONFIG) {
  const res = { ok: 0, warning: 0, alert: 0 };
  const warning = config.WARNING_THRESHOLD ?? 6;
  const alert = config.ALERT_THRESHOLD ?? 8;

  for (const s of students || []) {
    const idx = s?.academicRiskIndex ?? 0;
    if (idx >= alert) {
      res.alert += 1;
    } else if (idx >= warning) {
      res.warning += 1;
    } else {
      res.ok += 1;
    }
  }

  return res;
}