import { useCountUp } from "../../hooks/useCountUp.js";
import Card from "./Card.jsx";
import styles from "./StatCard.module.css";

export default function StatCard({
  title,
  value,
  icon: Icon,
  badge,
  tone = "primary",
  subtext,
}) {
  const animatedValue = useCountUp(value);

  return (
    <Card className={styles.statCard}>
      <div className={styles.topRow}>
        <span className={styles.title}>{title}</span>
        {Icon && (
          <div className={`${styles.iconWrap} ${styles[tone] || styles.primary}`} aria-hidden="true">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className={styles.valueRow}>
        {badge ? (
          badge
        ) : (
          <div className={`${styles.value} ${styles[`value_${tone}`] || ""}`}>
            {value !== null && value !== undefined && value !== "" ? animatedValue : "—"}
          </div>
        )}
      </div>

      {subtext && <div className={styles.subtext}>{subtext}</div>}
    </Card>
  );
}
