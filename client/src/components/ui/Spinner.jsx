import styles from "./Spinner.module.css";

export default function Spinner({ fullPage = false, label = "טוען..." }) {
  const el = <div className={styles.spinner} role="status" aria-label={label} />;
  return fullPage ? <div className={styles.full}>{el}</div> : <div className={styles.inline}>{el}</div>;
}
