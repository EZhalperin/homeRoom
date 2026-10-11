import styles from "./EmptyState.module.css";

export default function EmptyState({ title, children }) {
  return (
    <div className={styles.empty}>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
