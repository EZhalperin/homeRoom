import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/notifications.js";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { formatRelativeTime } from "../../utils/formatters.js";
import styles from "./Notifications.module.css";

const TYPE_LABELS = {
  announcement: { label: "הודעה", tone: "info" },
  chat: { label: "צ'אט", tone: "neutral" },
  grade: { label: "ציון", tone: "success" },
  attendance: { label: "נוכחות", tone: "warning" },
  form: { label: "טופס", tone: "info" },
  risk: { label: "התראת סיכון", tone: "danger" },
};

export default function Notifications() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", { unreadOnly }],
    queryFn: () => getNotifications({ unreadOnly }),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const items = Array.isArray(data) ? data : data?.items || [];
  const hasUnread = items.some((n) => !n.readAt);

  const handleClick = (notif) => {
    if (!notif.readAt) {
      markReadMutation.mutate(notif._id || notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>התראות מערכת</h1>
        <div className={styles.actions}>
          {hasUnread && (
            <Button
              variant="secondary"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              סמן הכל כנקרא
            </Button>
          )}
        </div>
      </header>

      <div className={styles.filters} role="tablist">
        <button
          className={`${styles.filterBtn} ${!unreadOnly ? styles.activeFilter : ""}`}
          onClick={() => setUnreadOnly(false)}
          role="tab"
          aria-selected={!unreadOnly}
        >
          כל ההתראות
        </button>
        <button
          className={`${styles.filterBtn} ${unreadOnly ? styles.activeFilter : ""}`}
          onClick={() => setUnreadOnly(true)}
          role="tab"
          aria-selected={unreadOnly}
        >
          לא נקראו בלבד
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          title={unreadOnly ? "אין התראות שלא נקראו" : "אין התראות עדיין"}
          description="כאשר יתקבלו עדכונים, הודעות או ציונים חדשים הם יופיעו כאן."
        />
      ) : (
        <div className={styles.list}>
          {items.map((notif) => {
            const id = notif._id || notif.id;
            const isUnread = !notif.readAt;
            const typeConfig = TYPE_LABELS[notif.type] || { label: notif.type, tone: "neutral" };

            return (
              <div
                key={id}
                className={`${styles.item} ${isUnread ? styles.unreadItem : ""}`}
                onClick={() => handleClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick(notif);
                  }
                }}
              >
                <div className={styles.itemHeader}>
                  <div className={styles.typeAndTitle}>
                    <Badge tone={typeConfig.tone}>{typeConfig.label}</Badge>
                    <span className={styles.itemTitle}>{notif.title}</span>
                  </div>
                  <span className={styles.itemDate}>{formatRelativeTime(notif.createdAt)}</span>
                </div>
                {notif.body && <p className={styles.itemBody}>{notif.body}</p>}
                {notif.link && (
                  <div className={styles.itemFooter}>
                    <span className={styles.linkHint}>מעבר לעמוד ←</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}