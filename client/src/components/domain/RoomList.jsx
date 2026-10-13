import { useState } from "react";
import { formatRelativeTime } from "../../utils/formatters.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useMyClass } from "../../hooks/queries.js";
import Button from "../ui/Button.jsx";
import Select from "../ui/Select.jsx";
import styles from "./RoomList.module.css";

export default function RoomList({ rooms, selectedRoomId, onSelectRoom, onStartChatWithStudent }) {
  const { user } = useAuth();
  const isTeacher = user.role === "teacher";
  const { data: myClass } = useMyClass();

  const [selectedStudentUuid, setSelectedStudentUuid] = useState("");

  const students = myClass?.students || [];

  const handleStartChat = () => {
    if (!selectedStudentUuid) return;
    onStartChatWithStudent(selectedStudentUuid);
    setSelectedStudentUuid("");
  };

  return (
    <aside className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>שיחות</h2>

        {isTeacher && students.length > 0 && (
          <div className={styles.newChatBox}>
            <Select
              label="שיחה חדשה עם הורי תלמיד/ה"
              value={selectedStudentUuid}
              onChange={(e) => setSelectedStudentUuid(e.target.value)}
            >
              <option value="">בחר/י תלמיד/ה...</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.firstName} {st.lastName}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedStudentUuid}
              onClick={handleStartChat}
            >
              פתח שיחה
            </Button>
          </div>
        )}
      </div>

      <div className={styles.list}>
        {rooms.length === 0 ? (
          <div className={styles.empty}>אין שיחות פעילות כרגע</div>
        ) : (
          rooms.map((room) => {
            const roomId = room._id || room.id;
            const isSelected = String(roomId) === String(selectedRoomId);
            const displayName = isTeacher
              ? room.studentName ? `הורי ${room.studentName}` : "שיחה"
              : room.teacherName ? `המחנך/ת ${room.teacherName}` : (room.studentName ? `שיחה עם המורה (${room.studentName})` : "שיחה עם המורה");

            return (
              <button
                key={roomId}
                className={`${styles.roomItem} ${isSelected ? styles.activeRoom : ""}`}
                onClick={() => onSelectRoom(room)}
              >
                <div className={styles.topRow}>
                  <span className={styles.studentName}>{displayName}</span>
                  {room.lastMessageAt && (
                    <span className={styles.time}>{formatRelativeTime(room.lastMessageAt)}</span>
                  )}
                </div>

                <div className={styles.bottomRow}>
                  <p className={styles.preview}>
                    {room.lastMessagePreview || "אין הודעות עדיין"}
                  </p>
                  {room.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>{room.unreadCount}</span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}