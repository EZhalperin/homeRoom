/**
 * Reads CSS variables from document root so charts seamlessly adapt to light / dark themes.
 * @module components/domain/charts/chartTheme
 */
export function getChartTheme() {
  if (typeof window === "undefined") {
    return {
      primary: "#2563eb",
      primarySoft: "#dbeafe",
      secondary: "#64748b",
      success: "#16a34a",
      warning: "#d97706",
      danger: "#dc2626",
      text: "#0f172a",
      textMuted: "#64748b",
      border: "#e2e8f0",
      bg: "#ffffff",
      surface: "#ffffff",
    };
  }

  const styles = getComputedStyle(document.documentElement);
  return {
    primary: styles.getPropertyValue("--color-primary").trim() || "#2563eb",
    primarySoft: styles.getPropertyValue("--color-primary-soft").trim() || "#dbeafe",
    secondary: styles.getPropertyValue("--color-text-muted").trim() || "#64748b",
    success: styles.getPropertyValue("--color-success").trim() || "#16a34a",
    warning: styles.getPropertyValue("--color-warning").trim() || "#d97706",
    danger: styles.getPropertyValue("--color-danger").trim() || "#dc2626",
    text: styles.getPropertyValue("--color-text").trim() || "#0f172a",
    textMuted: styles.getPropertyValue("--color-text-muted").trim() || "#64748b",
    border: styles.getPropertyValue("--color-border").trim() || "#e2e8f0",
    bg: styles.getPropertyValue("--color-bg").trim() || "#ffffff",
    surface: styles.getPropertyValue("--color-surface").trim() || "#ffffff",
  };
}