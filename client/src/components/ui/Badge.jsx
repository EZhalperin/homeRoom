import styles from "./Badge.module.css";

/** tone: neutral | success | warning | danger | info */
export default function Badge({ tone = "neutral", children }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
