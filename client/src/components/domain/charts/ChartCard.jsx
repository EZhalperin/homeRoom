import Spinner from "../../ui/Spinner.jsx";
import styles from "./ChartCard.module.css";

export default function ChartCard({
  title,
  subtitle,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "אין נתונים זמינים להצגה",
  error = null,
  children,
}) {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>

      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.loadingSkeleton}>
            <Spinner />
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <span>שגיאה בטעינת נתוני הגרף</span>
          </div>
        ) : isEmpty ? (
          <div className={styles.emptyState}>
            <span>📊 {emptyMessage}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </article>
  );
}