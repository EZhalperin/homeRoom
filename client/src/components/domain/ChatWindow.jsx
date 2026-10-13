import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatMessages, sendChatMessage, markChatRoomRead } from "../../api/chat.js";
import { useSocket } from "../../hooks/useSocket.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../ui/Toast.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import Spinner from "../ui/Spinner.jsx";
import styles from "./ChatWindow.module.css";

export default function ChatWindow({ room, onBack }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const roomId = room?._id || room?.id;

  const { data: rawMessages = [], isLoading } = useQuery({
    queryKey: ["chat-messages", roomId],
    queryFn: () => getChatMessages(roomId),
    enabled: Boolean(roomId),
  });

  // Backend returns newest first. Invert for chronological chat stream.
  const messages = [...rawMessages].reverse();

  const sendMutation = useMutation({
    mutationFn: (text) => sendChatMessage(roomId, text),
    onSuccess: (newMsg) => {
      queryClient.setQueryData(["chat-messages", roomId], (old = []) => [newMsg, ...old]);
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
    onError: (err) => {
      addToast({ text: err.response?.data?.message || "שגיאה בשליחת ההודעה", tone: "danger" });
    },
  });

  // Join socket room and handle incoming messages & typing
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("chat:join", { roomId });
    markChatRoomRead(roomId).catch(() => {});

    const handleMessage = (msg) => {
      if (String(msg.roomId) === String(roomId)) {
        queryClient.setQueryData(["chat-messages", roomId], (old = []) => {
          // Avoid duplicate if already inserted
          if (old.some((m) => String(m._id || m.id) === String(msg._id || msg.id))) {
            return old;
          }
          return [msg, ...old];
        });
        markChatRoomRead(roomId).catch(() => {});
      }
    };

    const handleTyping = (data) => {
      if (String(data.roomId) === String(roomId) && String(data.userId) !== String(user.userId)) {
        setIsOtherTyping(Boolean(data.isTyping));
      }
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:typing", handleTyping);

    return () => {
      socket.emit("chat:leave", { roomId });
      socket.off("chat:message", handleMessage);
      socket.off("chat:typing", handleTyping);
    };
  }, [socket, roomId, user.userId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isOtherTyping]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (socket && roomId) {
      socket.emit("chat:typing", { roomId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("chat:typing", { roomId, isTyping: false });
      }, 1500);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sendMutation.isPending) return;

    if (socket && roomId) {
      socket.emit("chat:typing", { roomId, isTyping: false });
    }

    sendMutation.mutate(trimmed);
    setInputText("");
  };

  const title =
    user.role === "teacher"
      ? room.studentName ? `הורי ${room.studentName}` : "הורים"
      : "מחנך/ת הכיתה";

  return (
    <div className={styles.window}>
      <header className={styles.header}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack} aria-label="חזרה לרשימת השיחות">
            →
          </button>
        )}
        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>{title}</h2>
          {isOtherTyping ? (
            <span className={styles.typingIndicator}>מקליד/ה...</span>
          ) : (
            <span className={styles.headerSubtitle}>
              {user.role === "teacher" ? "שיחה אישית עם ההורים" : "שיחה אישית עם צוות החינוך"}
            </span>
          )}
        </div>
      </header>

      <div className={styles.messagesList}>
        {isLoading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <div className={styles.emptyMessages}>
            <p>אין הודעות בשיחה זו עדיין.</p>
            <p style={{ fontSize: "var(--fs-sm)" }}>שלחו הודעה כדי להתחיל בשיחה.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isOwn = String(m.senderUserId) === String(user.userId);
            const msgId = m._id || m.id;

            return (
              <div
                key={msgId}
                className={`${styles.messageRow} ${isOwn ? styles.ownRow : styles.otherRow}`}
              >
                <div
                  className={`${styles.bubble} ${isOwn ? styles.ownBubble : styles.otherBubble}`}
                >
                  {m.text}
                </div>
                <time className={styles.messageTime} dateTime={m.createdAt}>
                  {formatDateTime(m.createdAt)}
                </time>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputBar} onSubmit={handleSend}>
        <input
          type="text"
          className={styles.textInput}
          placeholder="הקלד/י הודעה..."
          value={inputText}
          onChange={handleTextChange}
          maxLength={2000}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!inputText.trim() || sendMutation.isPending}
        >
          {sendMutation.isPending ? "שולח..." : "שלח"}
        </button>
      </form>
    </div>
  );
}