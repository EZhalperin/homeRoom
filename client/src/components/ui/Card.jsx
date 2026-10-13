import styles from "./Card.module.css";

export default function Card({ title, actions, interactive = false, children, className = "" }) {
  return (
    <div className={`${styles.card} ${interactive ? styles.interactive : ""} ${className}`}>
      {(title || actions) && (
        <header className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {actions && <div>{actions}</div>}
        </header>
      )}
      {children}
    </div>
  );
}