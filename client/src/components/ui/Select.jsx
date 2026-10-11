import { useId } from "react";
import styles from "./Field.module.css";

export default function Select({ label, error, id, children, ...props }) {
  const auto = useId();
  const selectId = id || auto;
  return (
    <div className={styles.field}>
      <label htmlFor={selectId}>{label}</label>
      <select id={selectId} aria-invalid={Boolean(error)} {...props}>{children}</select>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
