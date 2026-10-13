import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth.js";
import { tokenStore } from "../api/axiosClient.js";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = tokenStore.get();
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io({
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on("connect", () => {
      setIsConnected(true);
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    });

    s.on("announcement:new", () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    });

    s.on("chat:message", () => {
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    });

    s.on("chat:read", () => {
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setIsConnected(false);
    };
  }, [user, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  return context || { socket: null, isConnected: false };
}