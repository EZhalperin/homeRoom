import styles from "./Card.module.css";

export default function Card({ title, actions, children, className = "" }) {
  return (
    <section className={`${styles.card} ${className}`}>
      {(title || actions) && (
        <header className={styles.header}>
          {title && <h2>{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
