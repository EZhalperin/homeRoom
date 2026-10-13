import { useEffect, useState } from "react";

/**
 * Animated count-up hook for stat numbers.
 * Respects prefers-reduced-motion: reduce by returning the target immediately.
 * @param {number|string} target - The final target number
 * @param {number} [duration=600] - Duration in ms (clamped to max 600ms)
 * @returns {number|string} Animated current value
 */
export function useCountUp(target, duration = 600) {
  const numTarget = typeof target === "number" ? target : parseFloat(target);
  const isValidNumber = Number.isFinite(numTarget);

  const [count, setCount] = useState(() => {
    if (!isValidNumber) return target;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return numTarget;
    }
    return 0;
  });

  useEffect(() => {
    if (!isValidNumber) {
      setCount(target);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(numTarget);
      return;
    }

    let startTimestamp = null;
    let animationFrameId;
    const startValue = 0;
    const dur = Math.min(duration, 600);

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (numTarget - startValue) * eased;

      const isInteger = Number.isInteger(numTarget);
      setCount(isInteger ? Math.round(current) : parseFloat(current.toFixed(1)));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(numTarget);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [numTarget, isValidNumber, duration, target]);

  return isValidNumber ? count : target;
}
