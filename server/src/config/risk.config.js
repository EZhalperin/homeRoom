/**
 * Thresholds, windows, scaling factors, and weights for `riskIndexService`.
 * Tune here; keep the service a pure function of (student, now, config).
 * @module config/risk.config
 */

/** Maximum slope penalty: losing 10 points per consecutive test = trend 1.0. */
export const TREND_FULL_SLOPE = 10;

/** Maximum absence penalty: (absences + 0.5*lates) equal to 20% of the window = absence 1.0. */
export const ABSENCE_FULL_RATIO = 0.2;

/** Threshold for WARNING level. */
export const WARNING_THRESHOLD = 6;

/** Threshold for ALERT level. */
export const ALERT_THRESHOLD = 8;

export const RISK_CONFIG = {
  /** Linear-regression window: last N grades per subject. */
  N: 5,
  /** Attendance look-back window in days (denominator for the absence ratio). */
  window: 60,
  /** Losing 10 points per consecutive grade in a subject = trend 1. */
  TREND_FULL_SLOPE,
  /** Absences + 0.5*lates equal to 20% of the window = absence 1. */
  ABSENCE_FULL_RATIO,
  weights: {
    trend: 0.6,
    absence: 0.4,
  },
  WARNING_THRESHOLD,
  ALERT_THRESHOLD,
};

export default RISK_CONFIG;