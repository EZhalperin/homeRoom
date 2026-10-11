import { createContext, useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getMe, login as loginRequest, logout as logoutRequest } from "../api/auth.js";
import { setUnauthorizedHandler, tokenStore } from "../api/axiosClient.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  // Restore session on page load.
  useEffect(() => {
    if (!tokenStore.get()) return;
    getMe()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (userId, password) => {
    const data = await loginRequest(userId, password);
    tokenStore.set(data.token);
    const next = {
      id: data.id, userId, role: data.role,
      firstName: data.firstName, lastName: data.lastName,
    };
    setUser(next);
    return next;
  };

  const logout = async () => {
    try { await logoutRequest(); } catch { /* stateless: ignore */ }
    clearSession();
  };

  const updateUser = (patch) => setUser((u) => ({ ...u, ...patch }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
