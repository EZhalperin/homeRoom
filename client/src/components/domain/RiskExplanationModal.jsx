import { useQuery } from "@tanstack/react-query";
import { getTeacherStudentRisk } from "../../api/students.js";
import Modal from "../ui/Modal.jsx";
import Spinner from "../ui/Spinner.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import Badge from "../ui/Badge.jsx";
import styles from "./RiskExplanationModal.module.css";

const RECOMMENDATIONS = {
  alert: "המלצה: לתאם שיחת הורים דחופה ולגבש תוכנית התערבות פדגוגית מידית.",
  warning: "המלצה: לבצע מעקב שבועי אחר הגשת מטלות ושיפור נוכחות בשיעורים.",
  ok: "המלצה: מצב התלמיד/ה יציב ותקין, מומלץ להמשיך בשגרת הלמידה הנוכחית.",
};

export default function RiskExplanationModal({ open, onClose, student }) {
  const studentId = student?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["student-risk-breakdown", studentId],
    queryFn: () => getTeacherStudentRisk(studentId),
    enabled: Boolean(open && studentId),
  });

  const studentName = student ? `${student.firstName} ${student.lastName}` : "";
  const title = data
    ? `למה התקבל מדד ${data.index.toFixed(1)}? (${studentName})`
    : `פירוט מדד סיכון (${studentName})`;

  return (
    <Modal open={open} title={title} onClose={onClose}>
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <EmptyState
          title="שגיאה בטעינת פירוט המדד"
          description="לא ניתן היה לחשב את נתוני המדד עבור תלמיד זה."
        />
      ) : data ? (
        <div className={styles.container}>
          <div className={styles.scoreHeader}>
            <span className={styles.title}>
              רמת סיכון:{" "}
              {data.level === "alert"
                ? "גבוהה (Alert)"
                : data.level === "warning"
                ? "בינונית (Warning)"
                : "תקינה (OK)"}
            </span>
            <Badge
              tone={
                data.level === "alert"
                  ? "danger"
                  : data.level === "warning"
                  ? "warning"
                  : "success"
              }
            >
              ציון מדד: {data.index.toFixed(1)} / 10
            </Badge>
          </div>

          {/* Two labeled bars */}
          <div className={styles.barsGrid}>
            <div className={styles.barGroup}>
              <div className={styles.barHeader}>
                <span>מגמת ציונים (משקל 60%)</span>
                <strong>{data.components.trendPoints.toFixed(1)} / 6</strong>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    inlineSize: `${Math.min(100, (data.components.trendPoints / 6) * 100)}%`,
                    backgroundColor: "var(--color-primary)",
                  }}
                />
              </div>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>
                מדד מגמה גולמי: {(data.trend * 100).toFixed(0)}%
              </span>
            </div>

            <div className={styles.barGroup}>
              <div className={styles.barHeader}>
                <span>חיסורים ואיחורים (משקל 40%)</span>
                <strong>{data.components.absencePoints.toFixed(1)} / 4</strong>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    inlineSize: `${Math.min(100, (data.components.absencePoints / 4) * 100)}%`,
                    backgroundColor: "var(--color-warning)",
                  }}
                />
              </div>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>
                מדד היעדרות גולמי: {(data.absence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Declining subjects */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>מקצועות עם מגמת ירידה בציונים:</h4>
            {data.subjects && data.subjects.filter((s) => s.slope < 0).length > 0 ? (
              <ul className={styles.subjectList}>
                {data.subjects
                  .filter((s) => s.slope < 0)
                  .map((s) => (
                    <li key={s.subject} className={styles.subjectItem}>
                      <span>{s.subject}</span>
                      <span className={styles.decliningBadge}>
                        ירידה של {Math.abs(s.slope).toFixed(1)} נק' למבחן
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--color-text-muted)" }}>
                לא זוהתה ירידה מובהקת בציונים במקצועות השונים (נדרשים לפחות 2 ציונים למקצוע).
              </p>
            )}
          </div>

          {/* Absence and late counts */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>נוכחות ב-{data.counts.windowDays} הימים האחרונים:</h4>
            <div className={styles.attendanceInfo}>
              <span>{data.counts.absences} חיסורים</span>
              <span> · </span>
              <span>{data.counts.lates} איחורים (שקול ל-{(data.counts.lates * 0.5).toFixed(1)} חיסורים)</span>
            </div>
          </div>

          {/* One-line recommendation */}
          <div
            className={`${styles.recommendationBox} ${
              data.level === "alert"
                ? styles.recAlert
                : data.level === "warning"
                ? styles.recWarning
                : styles.recOk
            }`}
          >
            {RECOMMENDATIONS[data.level] || RECOMMENDATIONS.ok}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}