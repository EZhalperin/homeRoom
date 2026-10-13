import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../hooks/useTheme.js";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { toggleTheme, isDarkMode } = useTheme();

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isDarkMode ? "מעבר למצב בהיר" : "מעבר למצב כהה"}
      title={isDarkMode ? "מצב בהיר" : "מצב כהה"}
    >
      {isDarkMode ? <Sun size={18} className={styles.icon} /> : <Moon size={18} className={styles.icon} />}
    </button>
  );
}
