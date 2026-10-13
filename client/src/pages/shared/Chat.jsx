import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChatRooms, getOrCreateChatRoom } from "../../api/chat.js";
import { useAuth } from "../../hooks/useAuth.js";
import RoomList from "../../components/domain/RoomList.jsx";
import ChatWindow from "../../components/domain/ChatWindow.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import Button from "../../components/ui/Button.jsx";
import styles from "./Chat.module.css";

export default function Chat() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlRoomId = searchParams.get("roomId");
  const [selectedRoomId, setSelectedRoomId] = useState(urlRoomId || null);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["chat-rooms"],
    queryFn: getChatRooms,
  });

  const createRoomMutation = useMutation({
    mutationFn: (payload) => getOrCreateChatRoom(payload),
    onSuccess: (newRoom) => {
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
      const id = newRoom._id || newRoom.id;
      setSelectedRoomId(id);
      setSearchParams({ roomId: id });
    },
  });

  // Keep selectedRoomId in sync with query param
  useEffect(() => {
    if (urlRoomId && urlRoomId !== selectedRoomId) {
      setSelectedRoomId(urlRoomId);
    }
  }, [urlRoomId, selectedRoomId]);

  // For parent: if no room yet, create or get room automatically
  useEffect(() => {
    if (user.role === "parent" && !isLoading && rooms.length === 0 && !createRoomMutation.isPending) {
      createRoomMutation.mutate({});
    }
  }, [user.role, isLoading, rooms.length]);

  // If only 1 room exists and none selected, auto-select it
  useEffect(() => {
    if (!selectedRoomId && rooms.length === 1) {
      const firstId = rooms[0]._id || rooms[0].id;
      setSelectedRoomId(firstId);
      setSearchParams({ roomId: firstId });
    }
  }, [rooms, selectedRoomId, setSearchParams]);

  const activeRoom = rooms.find((r) => String(r._id || r.id) === String(selectedRoomId));

  const handleSelectRoom = (room) => {
    const id = room._id || room.id;
    setSelectedRoomId(id);
    setSearchParams({ roomId: id });
  };

  const handleBackToRooms = () => {
    setSelectedRoomId(null);
    setSearchParams({});
  };

  const handleStartChatWithStudent = (studentUuid) => {
    createRoomMutation.mutate({ studentUuid });
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className={styles.chatLayout}>
      <div
        className={`${styles.roomListPane} ${selectedRoomId ? styles.hiddenOnMobile : ""}`}
      >
        <RoomList
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
          onStartChatWithStudent={handleStartChatWithStudent}
        />
      </div>

      <div
        className={`${styles.chatWindowPane} ${!selectedRoomId ? styles.hiddenOnMobile : ""}`}
      >
        {activeRoom ? (
          <ChatWindow room={activeRoom} onBack={handleBackToRooms} />
        ) : (
          <div className={styles.noChatSelected}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h3>נא לבחור שיחה</h3>
            <p>בחרו שיחה מהרשימה או התחילו שיחה חדשה.</p>
            {user.role === "parent" && rooms.length === 0 && (
              <Button
                variant="primary"
                onClick={() => createRoomMutation.mutate({})}
                disabled={createRoomMutation.isPending}
              >
                יצירת קשר עם מחנך/ת הכיתה
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}