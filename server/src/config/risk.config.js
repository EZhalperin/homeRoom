/**
 * Thresholds and weights for `riskIndexService.calculate`.
 * Tune here; keep the service a pure function of (student, now, config).
 */
export const RISK_CONFIG = {
  /** Linear-regression window: last N grades per subject. */
  N: 5,
  /** Attendance look-back window in days (denominator for the absence ratio). */
  window: 60,
  weights: {
    trend: 0.6,
    absence: 0.4,
  },
  WARNING_THRESHOLD: 6,
  ALERT_THRESHOLD: 8,
};

export default RISK_CONFIG;
