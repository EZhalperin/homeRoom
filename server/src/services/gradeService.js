/**
 * Pure grade math. Never writes to a database.
 * @module services/gradeService
 */

/**
 * Weighted average per subject: sum(score * weight) / sum(weight).
 * Weights are not assumed to sum to 1.
 *
 * @param {Array<{subject: string, score: number, weight: number}>} grades
 * @returns {Record<string, number>|null} Per-subject averages, or null when there are no grades.
 */
export function weightedAverage(grades) {
  if (!Array.isArray(grades) || grades.length === 0) {
    return null;
  }

  /** @type {Map<string, { weightedSum: number, weightSum: number }>} */
  const bySubject = new Map();

  for (const grade of grades) {
    if (!grade || typeof grade.subject !== "string") {
      continue;
    }
    const score = Number(grade.score);
    const weight = Number(grade.weight);
    if (!Number.isFinite(score) || !Number.isFinite(weight)) {
      continue;
    }
    const current = bySubject.get(grade.subject) || { weightedSum: 0, weightSum: 0 };
    current.weightedSum += score * weight;
    current.weightSum += weight;
    bySubject.set(grade.subject, current);
  }

  if (bySubject.size === 0) {
    return null;
  }

  /** @type {Record<string, number>} */
  const result = {};
  for (const [subject, { weightedSum, weightSum }] of bySubject) {
    result[subject] = weightSum === 0 ? 0 : weightedSum / weightSum;
  }
  return result;
}

export default { weightedAverage };
