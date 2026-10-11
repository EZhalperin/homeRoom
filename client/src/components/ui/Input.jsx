import { useId } from "react";
import styles from "./Field.module.css";

/** `as="textarea"` renders a textarea. */
export default function Input({ label, error, id, as: Tag = "input", ...props }) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <Tag id={inputId} aria-invalid={Boolean(error)} {...props} />
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
