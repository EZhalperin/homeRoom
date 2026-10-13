import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "homeroom_theme";

/**
 * Manages light / dark theme and persists choice to localStorage.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(STORAGE_KEY) || "system";
  });

  const applyTheme = useCallback((currentTheme) => {
    const root = document.documentElement;
    if (currentTheme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (currentTheme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      // system
      root.removeAttribute("data-theme");
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
      if (newTheme === "system") {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, newTheme);
      }
    },
    [],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      // If currently dark or system dark, toggle to light; else dark
      const isDark =
        prev === "dark" ||
        (prev === "system" &&
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      const next = isDark ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return { theme, setTheme, toggleTheme, isDarkMode };
}
