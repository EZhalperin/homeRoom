import { Outlet } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import styles from "./AuthLayout.module.css";

export default function AuthLayout() {
  return (
    <div className={styles.wrap}>
      <aside className={styles.brandPanel} aria-hidden="true">
        <div className={styles.brandHeader}>
          <img src="/logo.png" alt="לוגו בית הספר" className={styles.heroLogo} />
          <span className={styles.brandName}>HomeRoom</span>
        </div>

        <div className={styles.brandBody}>
          <h1 className={styles.tagline}>
            מערכת ניהול פדגוגית חכמה ומקשרת
          </h1>
          <ul className={styles.featuresList}>
            <li className={styles.featureItem}>
              <CheckCircle2 size={20} className={styles.featureCheck} />
              <span>תקשורת שקופה וישירה בין מחנכים, הורים והנהלה</span>
            </li>
            <li className={styles.featureItem}>
              <CheckCircle2 size={20} className={styles.featureCheck} />
              <span>מעקב נוכחות וציונים רציף ובזמן אמת</span>
            </li>
            <li className={styles.featureItem}>
              <CheckCircle2 size={20} className={styles.featureCheck} />
              <span>מדד סיכון אקדמי לזיהוי מוקדם של מגמות לימודיות</span>
            </li>
          </ul>
        </div>

        <div className={styles.brandFooter}>
          <span>© HomeRoom · מערכת מוגנת ומאובטחת</span>
        </div>
      </aside>

      <section className={styles.formPanel}>
        <div className={styles.mobileBrand}>
          <img src="/logo.png" alt="לוגו בית הספר" className={styles.mobileLogoImg} />
          <h2 className={styles.mobileTitle}>HomeRoom</h2>
        </div>
        <div className={styles.formBox}>
          <Outlet />
        </div>
      </section>
    </div>
  );
}
