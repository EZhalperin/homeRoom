import styles from "./EmptyState.module.css";

export default function EmptyState({ title, children, action, icon }) {
  return (
    <div className={styles.empty}>
      <div className={styles.iconWrap} aria-hidden="true">
        {icon || (
          <svg
            className={styles.svg}
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="8" y="10" width="32" height="28" rx="4" />
            <path d="M8 18h32" />
            <path d="M20 26h8" />
            <circle cx="14" cy="14" r="1" fill="currentColor" />
            <circle cx="18" cy="14" r="1" fill="currentColor" />
          </svg>
        )}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {children && <p className={styles.description}>{children}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
