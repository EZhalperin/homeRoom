import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../api/notifications.js";
import { formatRelativeTime } from "../../utils/formatters.js";
import styles from "./NotificationBell.module.css";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30000,
  });

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => getNotifications({ limit: 5 }),
    enabled: isOpen,
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

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const count = unreadData?.count || 0;
  const notifications = notificationsData?.items || [];

  const handleItemClick = async (notif) => {
    if (!notif.readAt) {
      markReadMutation.mutate(notif._id || notif.id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <button
        className={styles.bellBtn}
        aria-label="התראות"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && <span className={styles.badge}>{count > 99 ? "99+" : count}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="dialog" aria-label="רשימת התראות">
          <div className={styles.header}>
            <span>התראות</span>
            {count > 0 && (
              <button
                className={styles.markAllBtn}
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                סמן הכל כנקרא
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>אין התראות חדשות</div>
            ) : (
              notifications.map((n) => {
                const id = n._id || n.id;
                const isUnread = !n.readAt;
                return (
                  <button
                    key={id}
                    className={`${styles.item} ${isUnread ? styles.unreadItem : ""}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className={styles.itemTop}>
                      <span className={styles.title}>{n.title}</span>
                      {isUnread && <span className={styles.unreadDot} />}
                    </div>
                    {n.body && <p className={styles.body}>{n.body}</p>}
                    <span className={styles.date}>{formatRelativeTime(n.createdAt)}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className={styles.footer}>
            <button
              className={styles.markAllBtn}
              onClick={() => {
                setIsOpen(false);
                navigate("/notifications");
              }}
            >
              לכל ההתראות
            </button>
          </div>
        </div>
      )}
    </div>
  );
}