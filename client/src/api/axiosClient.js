import axios from "axios";

const TOKEN_KEY = "homeroom_token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message;
    const isLogin = err.config?.url?.includes("/auth/login");
    // 401 = bad/expired token. 403 "Account is suspended" = suspended user.
    const dead = status === 401 || (status === 403 && message === "Account is suspended");
    if (dead && !isLogin) {
      tokenStore.clear();
      onUnauthorized?.();
    }
    return Promise.reject(err);
  },
);
