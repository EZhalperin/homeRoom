import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import { useAuth } from "../../hooks/useAuth.js";
import styles from "./AnnouncementCard.module.css";

const TARGET_LABELS = {
  all: { label: "לכל בית הספר", tone: "info" },
  teachers: { label: "למורים בלבד", tone: "neutral" },
  parents: { label: "להורים בלבד", tone: "neutral" },
  class: { label: "כיתה ספציפית", tone: "warning" },
};

export default function AnnouncementCard({ announcement, onDelete }) {
  const { user } = useAuth();
  const targetConfig = TARGET_LABELS[announcement.target] || {
    label: announcement.target,
    tone: "neutral",
  };

  const isAuthor = String(announcement.authorUserId) === String(user.userId);
  const canDelete = user.role === "admin" || isAuthor;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>{announcement.title}</h2>
          <div className={styles.meta}>
            <Badge tone={targetConfig.tone}>{targetConfig.label}</Badge>
            <span>מאת: {announcement.authorName || "צוות בית הספר"}</span>
            <span>·</span>
            <time dateTime={announcement.createdAt}>{formatDateTime(announcement.createdAt)}</time>
          </div>
        </div>

        {canDelete && onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(announcement._id || announcement.id)}
          >
            מחיקה
          </Button>
        )}
      </div>

      <p className={styles.body}>{announcement.body}</p>
    </article>
  );
}