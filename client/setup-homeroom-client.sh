#!/usr/bin/env bash
# HomeRoom client scaffold.
# הרצה: מתוך תיקיית client/ (אחרי npm create vite@latest) -> bash setup-homeroom-client.sh
set -e

if [ ! -f package.json ]; then
  echo "לא נמצא package.json. הרץ את הסקריפט מתוך תיקיית client/" >&2
  exit 1
fi

# ---------- 0. התקנה וניקוי ----------
npm install react-router-dom axios @tanstack/react-query recharts
rm -f src/App.css src/index.css
rm -rf src/assets
mkdir -p src/{api,context,hooks,routes,layouts,styles,utils}
mkdir -p src/components/{ui,domain} src/pages/{auth,admin,teacher,parent,shared}

# helper: w <path>  (קורא את התוכן מ-stdin)
w() { mkdir -p "$(dirname "$1")"; cat > "$1"; }

# ---------- 1. vite.config.js ו-index.html ----------
w vite.config.js <<'EOF_FILE'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:3000" } },
});
EOF_FILE

w index.html <<'EOF_FILE'
<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HomeRoom</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF_FILE

# ---------- 2. Styles ----------
w src/styles/tokens.css <<'EOF_FILE'
:root {
  --color-primary: #2f5bea;
  --color-primary-hover: #2449c4;
  --color-primary-soft: #e8eefe;
  --color-bg: #f6f7fb;
  --color-surface: #ffffff;
  --color-text: #1b1f2a;
  --color-text-muted: #5b6475;
  --color-border: #dfe3ec;

  --color-success: #1f9d63; --color-success-soft: #e4f6ec;
  --color-warning: #c77d0a; --color-warning-soft: #fdf1da;
  --color-danger: #d64545;  --color-danger-soft: #fde8e8;

  --font-body: "Heebo", system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
  --fs-sm: 0.875rem; --fs-md: 1rem; --fs-lg: 1.25rem; --fs-xl: 1.625rem;
  --lh-body: 1.6;

  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem; --space-6: 1.5rem; --space-8: 2rem;

  --radius-sm: 8px; --radius-md: 12px; --radius-pill: 999px;
  --shadow-sm: 0 1px 3px rgb(20 30 60 / 8%);
  --shadow-md: 0 8px 24px rgb(20 30 60 / 12%);

  --nav-height: 56px;
  --bottom-nav-height: 64px;
  --sidebar-width: 248px;
  --tap-target: 44px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #12151c; --color-surface: #1b2029;
    --color-text: #e8ebf2; --color-text-muted: #9aa3b5;
    --color-border: #2c3341; --color-primary-soft: #1e2a4d;
    --color-success-soft: #123524; --color-warning-soft: #3a2a0a; --color-danger-soft: #3d1717;
  }
}
EOF_FILE

w src/styles/base.css <<'EOF_FILE'
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; font-family: var(--font-body); font-size: var(--fs-md);
  line-height: var(--lh-body); color: var(--color-text); background: var(--color-bg);
}
h1, h2, h3, p { margin: 0; }
h1 { font-size: var(--fs-xl); }
h2 { font-size: var(--fs-lg); }
a { color: var(--color-primary); }
img, svg { max-width: 100%; }
button, input, select, textarea { font: inherit; color: inherit; }
:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
EOF_FILE

w src/styles/utilities.css <<'EOF_FILE'
.container { width: min(100% - 2rem, 72rem); margin-inline: auto; }
.stack > * + * { margin-block-start: var(--space-4); }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
.muted { color: var(--color-text-muted); font-size: var(--fs-sm); }
.visually-hidden {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

.page-header {
  display: flex; flex-wrap: wrap; align-items: center;
  justify-content: space-between; gap: var(--space-3);
  margin-block-end: var(--space-4);
}

.grid { display: grid; gap: var(--space-4); }
@media (min-width: 600px) { .grid-2 { grid-template-columns: repeat(2, 1fr); } .grid-3 { grid-template-columns: repeat(3, 1fr); } }

.auth-wrap { min-height: 100dvh; display: grid; place-items: center; padding: var(--space-4); }
.auth-box { width: min(100%, 24rem); }

.toolbar { display: grid; gap: var(--space-3); margin-block-end: var(--space-4); }
@media (min-width: 600px) { .toolbar { grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); align-items: end; } }

.stat { font-size: var(--fs-xl); font-weight: 700; color: var(--color-primary); }
EOF_FILE

w src/styles/table.css <<'EOF_FILE'
.table-wrap { background: var(--color-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td {
  padding: var(--space-3); text-align: start;
  border-block-end: 1px solid var(--color-border);
}
.table th { font-size: var(--fs-sm); color: var(--color-text-muted); font-weight: 600; }

@media (max-width: 959px) {
  .table-wrap { background: none; box-shadow: none; }
  .table thead { display: none; }
  .table, .table tbody, .table tr, .table td { display: block; }
  .table tr {
    background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: var(--radius-md); margin-block-end: var(--space-3); padding: var(--space-2);
  }
  .table td {
    display: flex; justify-content: space-between; align-items: center;
    gap: var(--space-3); border: 0; padding: var(--space-2) var(--space-3);
  }
  .table td::before { content: attr(data-label); font-weight: 600; color: var(--color-text-muted); }
}
EOF_FILE

# ---------- 3. Utils ----------
w src/utils/constants.js <<'EOF_FILE'
export const ROLES = { ADMIN: "admin", TEACHER: "teacher", PARENT: "parent" };

export const ROLE_HOME = { admin: "/admin", teacher: "/teacher", parent: "/parent" };
export const ROLE_LABEL = { admin: "הנהלה", teacher: "מורה", parent: "הורה" };

/** Same thresholds as server/src/config/risk.config.js */
export const RISK_WARNING = 6;
export const RISK_ALERT = 8;

export const ATTENDANCE_LABEL = { absence: "חיסור", late: "איחור" };
EOF_FILE

w src/utils/formatters.js <<'EOF_FILE'
// Dates are stored as UTC midnight, so display in UTC to avoid off-by-one-day.
const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium", timeZone: "UTC" });

export const formatDate = (v) => (v ? dateFmt.format(new Date(v)) : "—");
export const toDateInput = (v) => new Date(v).toISOString().slice(0, 10);
export const todayInput = () => new Date().toISOString().slice(0, 10);
export const formatNumber = (n, digits = 1) =>
  typeof n === "number" ? n.toFixed(digits) : "—";
export const fullName = (p) => `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();
EOF_FILE

w src/utils/errors.js <<'EOF_FILE'
/** Server errors are always { message }. */
export function getErrorMessage(err) {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === "ERR_NETWORK") return "אין חיבור לשרת";
  return "אירעה שגיאה. נסה שוב.";
}
EOF_FILE

# ---------- 4. API ----------
w src/api/axiosClient.js <<'EOF_FILE'
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
EOF_FILE

w src/api/auth.js <<'EOF_FILE'
import { api } from "./axiosClient.js";

export const login = (userId, password) =>
  api.post("/auth/login", { userId, password }).then((r) => r.data);
export const logout = () => api.post("/auth/logout").then((r) => r.data);
export const getMe = () => api.get("/auth/me").then((r) => r.data);
EOF_FILE

w src/api/users.js <<'EOF_FILE'
import { api } from "./axiosClient.js";

export const updateMe = (body) => api.patch("/users/me", body).then((r) => r.data);
export const adminListUsers = (params) => api.get("/admin/users", { params }).then((r) => r.data);
export const adminRegister = (body) => api.post("/admin/users/register", body).then((r) => r.data);
export const adminUpdateUser = (id, body) => api.put(`/admin/users/${id}`, body).then((r) => r.data);
export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);
EOF_FILE

w src/api/classes.js <<'EOF_FILE'
import { api } from "./axiosClient.js";

export const adminCreateClass = (body) => api.post("/admin/classes", body).then((r) => r.data);
export const staffListClasses = (params) => api.get("/staff/classes", { params }).then((r) => r.data);
export const getMyClass = () => api.get("/teachers/my-class").then((r) => r.data);
export const adminDeleteClass = (id) => api.delete(`/admin/classes/${id}`).then((r) => r.data);
EOF_FILE

w src/api/students.js <<'EOF_FILE'
import { api } from "./axiosClient.js";

export const adminAddStudent = (classId, body) =>
  api.post(`/admin/classes/${classId}/students`, body).then((r) => r.data);
export const adminListStudents = () => api.get("/admin/students").then((r) => r.data);
export const adminDeleteStudent = (classId, id) =>
  api.delete(`/admin/classes/${classId}/students/${id}`).then((r) => r.data);
export const getMyChild = () => api.get("/parents/my-child").then((r) => r.data);
EOF_FILE

w src/api/grades.js <<'EOF_FILE'
import { api } from "./axiosClient.js";

export const addGrade = (studentId, body) =>
  api.post(`/teachers/students/${studentId}/grades`, body).then((r) => r.data);
export const updateGrade = (studentId, body) =>
  api.put(`/teachers/students/${studentId}/grades`, body).then((r) => r.data);
EOF_FILE

w src/api/attendance.js <<'EOF_FILE'
import { api } from "./axiosClient.js";

export const addAttendance = (studentId, body) =>
  api.post(`/teachers/students/${studentId}/attendance`, body).then((r) => r.data);
export const updateAttendance = (studentId, body) =>
  api.put(`/teachers/students/${studentId}/attendance`, body).then((r) => r.data);
EOF_FILE

w src/api/forms.js <<'EOF_FILE'
import { api } from "./axiosClient.js";

export const teacherCreateForm = (body) => api.post("/teachers/forms", body).then((r) => r.data);
export const teacherUpdateForm = (body) => api.put("/teachers/forms", body).then((r) => r.data);
export const parentApproveForm = (studentId, title) =>
  api
    .patch(`/parents/students/${studentId}/forms/${encodeURIComponent(title)}/approve`)
    .then((r) => r.data);
EOF_FILE

# קבצים ריקים עד שיהיה להם API
touch src/api/messages.js src/api/announcements.js src/api/analytics.js

# ---------- 5. Context ו-hooks ----------
w src/context/AuthContext.jsx <<'EOF_FILE'
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
EOF_FILE

w src/hooks/useAuth.js <<'EOF_FILE'
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
EOF_FILE

w src/hooks/queries.js <<'EOF_FILE'
import { useQuery } from "@tanstack/react-query";
import { getMyClass } from "../api/classes.js";
import { getMyChild } from "../api/students.js";

export const useMyClass = () => useQuery({ queryKey: ["myClass"], queryFn: getMyClass });
export const useMyChild = () => useQuery({ queryKey: ["myChild"], queryFn: getMyChild, retry: false });
EOF_FILE

w src/hooks/useApiMutation.js <<'EOF_FILE'
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/ui/Toast.jsx";
import { getErrorMessage } from "../utils/errors.js";

/**
 * Mutation with: invalidate query keys, success toast, error toast.
 * @param {(vars:any)=>Promise<any>} fn
 * @param {{ invalidate?: unknown[][], success?: string, onSuccess?: Function }} [opts]
 */
export function useApiMutation(fn, { invalidate = [], success, onSuccess } = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data, vars) => {
      invalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      if (success) toast.success(success);
      onSuccess?.(data, vars);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
EOF_FILE

# ---------- 6. Routes ----------
w src/routes/ProtectedRoute.jsx <<'EOF_FILE'
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Spinner from "../components/ui/Spinner.jsx";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner fullPage />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
EOF_FILE

w src/routes/RoleRoute.jsx <<'EOF_FILE'
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { ROLE_HOME } from "../utils/constants.js";

/** Lets only the given roles in; everyone else goes to their own home. */
export default function RoleRoute({ roles }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}
EOF_FILE

# ---------- 7. components/ui ----------
w src/components/ui/Spinner.jsx <<'EOF_FILE'
import styles from "./Spinner.module.css";

export default function Spinner({ fullPage = false, label = "טוען..." }) {
  const el = <div className={styles.spinner} role="status" aria-label={label} />;
  return fullPage ? <div className={styles.full}>{el}</div> : <div className={styles.inline}>{el}</div>;
}
EOF_FILE

w src/components/ui/Spinner.module.css <<'EOF_FILE'
.spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 4px solid var(--color-border); border-top-color: var(--color-primary);
  animation: spin 0.8s linear infinite;
}
.full { min-height: 100dvh; display: grid; place-items: center; }
.inline { display: grid; place-items: center; padding: var(--space-8); }
@keyframes spin { to { transform: rotate(360deg); } }
EOF_FILE

w src/components/ui/Button.jsx <<'EOF_FILE'
import styles from "./Button.module.css";

/** variant: primary | secondary | danger | ghost */
export default function Button({
  variant = "primary", loading = false, disabled, className = "", children, type = "button", ...props
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? "..." : children}
    </button>
  );
}
EOF_FILE

w src/components/ui/Button.module.css <<'EOF_FILE'
.btn {
  min-height: var(--tap-target); padding-inline: var(--space-4);
  border: 1px solid transparent; border-radius: var(--radius-sm);
  font-weight: 500; cursor: pointer; transition: background 0.15s;
}
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.primary { background: var(--color-primary); color: #fff; }
.primary:hover:not(:disabled) { background: var(--color-primary-hover); }
.secondary { background: var(--color-surface); border-color: var(--color-border); }
.secondary:hover:not(:disabled) { background: var(--color-primary-soft); }
.danger { background: var(--color-danger); color: #fff; }
.ghost { background: transparent; color: var(--color-text-muted); }
.ghost:hover:not(:disabled) { background: var(--color-primary-soft); }
EOF_FILE

w src/components/ui/Input.jsx <<'EOF_FILE'
import { useId } from "react";
import styles from "./Field.module.css";

/** `as="textarea"` renders a textarea. */
export default function Input({ label, error, id, as: Tag = "input", ...props }) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <Tag id={inputId} aria-invalid={Boolean(error)} {...props} />
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
EOF_FILE

w src/components/ui/Select.jsx <<'EOF_FILE'
import { useId } from "react";
import styles from "./Field.module.css";

export default function Select({ label, error, id, children, ...props }) {
  const auto = useId();
  const selectId = id || auto;
  return (
    <div className={styles.field}>
      <label htmlFor={selectId}>{label}</label>
      <select id={selectId} aria-invalid={Boolean(error)} {...props}>{children}</select>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
EOF_FILE

w src/components/ui/Field.module.css <<'EOF_FILE'
.field { display: grid; gap: var(--space-1); }
.field label { font-size: var(--fs-sm); font-weight: 500; }
.field input, .field select, .field textarea {
  min-height: var(--tap-target); padding: var(--space-2) var(--space-3);
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-sm); width: 100%;
}
.field textarea { min-height: 6rem; resize: vertical; }
.field [aria-invalid="true"] { border-color: var(--color-danger); }
.error { color: var(--color-danger); font-size: var(--fs-sm); }
EOF_FILE

w src/components/ui/Card.jsx <<'EOF_FILE'
import styles from "./Card.module.css";

export default function Card({ title, actions, children, className = "" }) {
  return (
    <section className={`${styles.card} ${className}`}>
      {(title || actions) && (
        <header className={styles.header}>
          {title && <h2>{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
EOF_FILE

w src/components/ui/Card.module.css <<'EOF_FILE'
.card {
  background: var(--color-surface); border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm); padding: var(--space-4);
}
.header { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); margin-block-end: var(--space-3); }
EOF_FILE

w src/components/ui/Badge.jsx <<'EOF_FILE'
import styles from "./Badge.module.css";

/** tone: neutral | success | warning | danger | info */
export default function Badge({ tone = "neutral", children }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
EOF_FILE

w src/components/ui/Badge.module.css <<'EOF_FILE'
.badge {
  display: inline-block; padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill); font-size: var(--fs-sm); font-weight: 600;
}
.neutral { background: var(--color-border); color: var(--color-text); }
.info { background: var(--color-primary-soft); color: var(--color-primary); }
.success { background: var(--color-success-soft); color: var(--color-success); }
.warning { background: var(--color-warning-soft); color: var(--color-warning); }
.danger { background: var(--color-danger-soft); color: var(--color-danger); }
EOF_FILE

w src/components/ui/EmptyState.jsx <<'EOF_FILE'
import styles from "./EmptyState.module.css";

export default function EmptyState({ title, children }) {
  return (
    <div className={styles.empty}>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
EOF_FILE

w src/components/ui/EmptyState.module.css <<'EOF_FILE'
.empty { text-align: center; padding: var(--space-8) var(--space-4); display: grid; gap: var(--space-2); }
EOF_FILE

w src/components/ui/Modal.jsx <<'EOF_FILE'
import { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

export default function Modal({ open, title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {open && (
        <div className={styles.body}>
          <header className={styles.header}>
            <h2>{title}</h2>
            <button className={styles.close} aria-label="סגירה" onClick={onClose}>×</button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
EOF_FILE

w src/components/ui/Modal.module.css <<'EOF_FILE'
.dialog {
  width: min(100% - 2rem, 30rem); padding: 0; border: 0;
  border-radius: var(--radius-md); box-shadow: var(--shadow-md);
  background: var(--color-surface); color: var(--color-text);
}
.dialog::backdrop { background: rgb(0 0 0 / 45%); }
.body { padding: var(--space-4); display: grid; gap: var(--space-4); }
.header { display: flex; justify-content: space-between; align-items: center; }
.close {
  width: var(--tap-target); height: var(--tap-target); border: 0; background: none;
  font-size: 1.5rem; cursor: pointer; border-radius: var(--radius-sm);
}
EOF_FILE

w src/components/ui/ConfirmDialog.jsx <<'EOF_FILE'
import Modal from "./Modal.jsx";
import Button from "./Button.jsx";

export default function ConfirmDialog({ open, title, message, confirmLabel = "אישור", loading, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="row">
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        <Button variant="secondary" onClick={onCancel}>ביטול</Button>
      </div>
    </Modal>
  );
}
EOF_FILE

w src/components/ui/Toast.jsx <<'EOF_FILE'
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import styles from "./Toast.module.css";

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const api = useMemo(
    () => ({ success: (m) => push(m, "success"), error: (m) => push(m, "error") }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
EOF_FILE

w src/components/ui/Toast.module.css <<'EOF_FILE'
.region {
  position: fixed; z-index: 100; inset-inline: var(--space-4);
  inset-block-end: calc(var(--bottom-nav-height) + var(--space-4));
  display: grid; gap: var(--space-2); justify-items: center; pointer-events: none;
}
.toast {
  padding: var(--space-3) var(--space-4); border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md); color: #fff; max-width: 28rem;
}
.success { background: var(--color-success); }
.error { background: var(--color-danger); }
EOF_FILE

# ---------- 8. components/domain ----------
w src/components/domain/RiskBadge.jsx <<'EOF_FILE'
import Badge from "../ui/Badge.jsx";
import { RISK_ALERT, RISK_WARNING } from "../../utils/constants.js";
import { formatNumber } from "../../utils/formatters.js";

/** Text + color together, so meaning never depends on color alone. */
export default function RiskBadge({ value = 0 }) {
  let tone = "success", label = "תקין";
  if (value >= RISK_ALERT) { tone = "danger"; label = "סיכון גבוה"; }
  else if (value >= RISK_WARNING) { tone = "warning"; label = "אזהרה"; }
  return <Badge tone={tone}>{label} · {formatNumber(value)}</Badge>;
}
EOF_FILE

w src/components/domain/GradeChart.jsx <<'EOF_FILE'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** @param {{ averages: Record<string, number>|null }} props */
export default function GradeChart({ averages }) {
  const data = Object.entries(averages || {}).map(([subject, avg]) => ({
    subject, avg: Math.round(avg * 10) / 10,
  }));
  if (data.length === 0) return <p className="muted">אין עדיין ציונים להצגה</p>;

  return (
    // Numeric axes read left-to-right even in Hebrew.
    <div dir="ltr" style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="subject" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="avg" name="ממוצע משוקלל" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
EOF_FILE

w src/components/domain/GradesTable.jsx <<'EOF_FILE'
import { formatDate } from "../../utils/formatters.js";

/** @param {{ grades: any[], renderActions?: (g:any)=>React.ReactNode }} props */
export default function GradesTable({ grades = [], renderActions }) {
  const sorted = [...grades].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sorted.length === 0) return <p className="muted">אין ציונים</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>מקצוע</th><th>מטלה</th><th>ציון</th><th>משקל</th><th>תאריך</th>{renderActions && <th />}</tr>
        </thead>
        <tbody>
          {sorted.map((g, i) => (
            <tr key={`${g.subject}-${g.taskName}-${g.date}-${i}`}>
              <td data-label="מקצוע">{g.subject}</td>
              <td data-label="מטלה">{g.taskName}</td>
              <td data-label="ציון">{g.score}</td>
              <td data-label="משקל">{Math.round(g.weight * 100)}%</td>
              <td data-label="תאריך">{formatDate(g.date)}</td>
              {renderActions && <td>{renderActions(g)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF_FILE

w src/components/domain/AttendanceList.jsx <<'EOF_FILE'
import Badge from "../ui/Badge.jsx";
import { ATTENDANCE_LABEL } from "../../utils/constants.js";
import { formatDate } from "../../utils/formatters.js";

export default function AttendanceList({ records = [], renderActions }) {
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sorted.length === 0) return <p className="muted">אין רישומי נוכחות</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>תאריך</th><th>סוג</th>{renderActions && <th />}</tr></thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={`${r.date}-${r.type}-${i}`}>
              <td data-label="תאריך">{formatDate(r.date)}</td>
              <td data-label="סוג">
                <Badge tone={r.type === "absence" ? "danger" : "warning"}>{ATTENDANCE_LABEL[r.type]}</Badge>
              </td>
              {renderActions && <td>{renderActions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF_FILE

w src/components/domain/StudentSelect.jsx <<'EOF_FILE'
import Select from "../ui/Select.jsx";
import { fullName } from "../../utils/formatters.js";

export default function StudentSelect({ students, value, onChange }) {
  return (
    <Select label="תלמיד" value={value} onChange={(e) => onChange(e.target.value)}>
      {students.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
    </Select>
  );
}
EOF_FILE

w src/components/domain/FormCard.jsx <<'EOF_FILE'
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import { formatDate } from "../../utils/formatters.js";

export default function FormCard({ form, onApprove, loading }) {
  const expired = new Date(form.deadline) < new Date();
  return (
    <Card>
      <div className="stack">
        <div className="page-header" style={{ marginBlockEnd: 0 }}>
          <h2>{form.title}</h2>
          {form.isApproved ? <Badge tone="success">אושר</Badge>
            : expired ? <Badge tone="danger">פג תוקף</Badge>
            : <Badge tone="warning">ממתין לאישור</Badge>}
        </div>
        <p>{form.description}</p>
        <p className="muted">יעד אחרון לאישור: {formatDate(form.deadline)}</p>
        {!form.isApproved && !expired && (
          <Button loading={loading} onClick={onApprove}>אישור הטופס</Button>
        )}
      </div>
    </Card>
  );
}
EOF_FILE

# ---------- 9. Layouts ----------
w src/layouts/AppShell.jsx <<'EOF_FILE'
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Button from "../components/ui/Button.jsx";
import { ROLE_LABEL } from "../utils/constants.js";
import styles from "./AppShell.module.css";

/**
 * Shared shell. Desktop: topbar + sidebar. Mobile: drawer, or a bottom nav (bottomNav=true).
 * @param {{ nav: {to:string,label:string,end?:boolean}[], bottomNav?: boolean }} props
 */
export default function AppShell({ nav, bottomNav = false }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const links = (cls) =>
    nav.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) => `${cls} ${isActive ? styles.active : ""}`}
      >
        {item.label}
      </NavLink>
    ));

  return (
    <div className={`${styles.shell} ${bottomNav ? styles.hasBottom : ""}`}>
      <header className={styles.topbar}>
        {!bottomNav && (
          <button className={styles.menuBtn} aria-label="תפריט" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            ☰
          </button>
        )}
        <span className={styles.brand}>HomeRoom</span>
        <span className={styles.user}>{user.firstName} {user.lastName} · {ROLE_LABEL[user.role]}</span>
        <Button variant="ghost" onClick={logout}>יציאה</Button>
      </header>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}
      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <nav>{links(styles.link)}</nav>
      </aside>

      <main className={styles.main}><Outlet /></main>

      {bottomNav && <nav className={styles.bottomNav}>{links(styles.bLink)}</nav>}
    </div>
  );
}
EOF_FILE

w src/layouts/AppShell.module.css <<'EOF_FILE'
.shell {
  min-height: 100dvh; display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: var(--nav-height) 1fr;
  grid-template-areas: "top" "main";
}
.topbar {
  grid-area: top; position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; gap: var(--space-3); padding-inline: var(--space-4);
  background: var(--color-surface); border-block-end: 1px solid var(--color-border);
}
.brand { font-weight: 700; font-size: var(--fs-lg); color: var(--color-primary); }
.user { margin-inline-start: auto; font-size: var(--fs-sm); color: var(--color-text-muted); }
.menuBtn {
  width: var(--tap-target); height: var(--tap-target); border: 0; background: none;
  font-size: 1.4rem; cursor: pointer; border-radius: var(--radius-sm);
}
.main { grid-area: main; padding: var(--space-4); min-width: 0; }
.hasBottom .main { padding-block-end: calc(var(--bottom-nav-height) + var(--space-6)); }

.sidebar { display: none; }
.sidebar.open {
  display: block; position: fixed; z-index: 30; padding: var(--space-4);
  inset-block: var(--nav-height) 0; inset-inline-start: 0; width: var(--sidebar-width);
  background: var(--color-surface); border-inline-end: 1px solid var(--color-border);
}
.hasBottom .sidebar.open { display: none; }
.backdrop { position: fixed; inset: 0; z-index: 25; background: rgb(0 0 0 / 40%); }

.link {
  display: flex; align-items: center; min-height: var(--tap-target);
  padding-inline: var(--space-4); border-radius: var(--radius-sm);
  color: var(--color-text); text-decoration: none;
}
.link:hover { background: var(--color-primary-soft); }
.link.active { background: var(--color-primary-soft); color: var(--color-primary); font-weight: 600; }

.bottomNav {
  position: fixed; z-index: 20; inset-inline: 0; inset-block-end: 0;
  height: var(--bottom-nav-height); display: flex;
  background: var(--color-surface); border-block-start: 1px solid var(--color-border);
}
.bLink {
  flex: 1; display: grid; place-items: center; text-align: center;
  font-size: var(--fs-sm); color: var(--color-text-muted); text-decoration: none;
}
.bLink.active { color: var(--color-primary); font-weight: 600; }

@media (min-width: 960px) {
  .shell {
    grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
    grid-template-areas: "top top" "side main";
  }
  .sidebar, .sidebar.open, .hasBottom .sidebar, .hasBottom .sidebar.open {
    display: block; grid-area: side; position: sticky; z-index: auto;
    inset-block: auto; top: var(--nav-height); width: auto; align-self: start;
    height: calc(100dvh - var(--nav-height)); padding: var(--space-4);
    background: var(--color-surface); border-inline-end: 1px solid var(--color-border);
  }
  .menuBtn, .backdrop, .bottomNav { display: none; }
  .main, .hasBottom .main { padding: var(--space-8); }
}
EOF_FILE

w src/layouts/AdminLayout.jsx <<'EOF_FILE'
import AppShell from "./AppShell.jsx";

const NAV = [
  { to: "/admin", label: "לוח בקרה", end: true },
  { to: "/admin/users", label: "משתמשים" },
  { to: "/admin/classes", label: "כיתות" },
  { to: "/admin/announcements", label: "הודעות גלובליות" },
  { to: "/admin/notifications", label: "התראות" },
  { to: "/admin/profile", label: "פרופיל" },
];

export default function AdminLayout() {
  return <AppShell nav={NAV} />;
}
EOF_FILE

w src/layouts/TeacherLayout.jsx <<'EOF_FILE'
import AppShell from "./AppShell.jsx";

const NAV = [
  { to: "/teacher", label: "הכיתה שלי", end: true },
  { to: "/teacher/grades", label: "ציונים" },
  { to: "/teacher/attendance", label: "נוכחות" },
  { to: "/teacher/forms", label: "טפסים" },
  { to: "/teacher/risk", label: "תלמידים בסיכון" },
  { to: "/teacher/chat", label: "צ'אט" },
  { to: "/teacher/profile", label: "פרופיל" },
];

export default function TeacherLayout() {
  return <AppShell nav={NAV} />;
}
EOF_FILE

w src/layouts/ParentLayout.jsx <<'EOF_FILE'
import AppShell from "./AppShell.jsx";

const NAV = [
  { to: "/parent", label: "סקירה", end: true },
  { to: "/parent/forms", label: "טפסים" },
  { to: "/parent/report-absence", label: "חיסור" },
  { to: "/parent/chat", label: "צ'אט" },
  { to: "/parent/profile", label: "פרופיל" },
];

export default function ParentLayout() {
  return <AppShell nav={NAV} bottomNav />;
}
EOF_FILE

w src/layouts/AuthLayout.jsx <<'EOF_FILE'
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="auth-wrap">
      <div className="auth-box stack">
        <h1 style={{ textAlign: "center", color: "var(--color-primary)" }}>HomeRoom</h1>
        <Outlet />
      </div>
    </div>
  );
}
EOF_FILE

# ---------- 10. Pages ----------
# placeholders
w src/pages/shared/ComingSoon.jsx <<'EOF_FILE'
import EmptyState from "../../components/ui/EmptyState.jsx";
export default function ComingSoon({ title }) {
  return <EmptyState title={title}>הפיצ'ר ייבנה בשלב מאוחר יותר</EmptyState>;
}
EOF_FILE

mk() { # path, Component, title
  w "$1" <<EOF_FILE
import ComingSoon from "../shared/ComingSoon.jsx";
export default function $2() { return <ComingSoon title="$3" />; }
EOF_FILE
}
mk src/pages/shared/Chat.jsx Chat "צ'אט"
mk src/pages/shared/Notifications.jsx Notifications "התראות"
mk src/pages/admin/Announcements.jsx Announcements "הודעות גלובליות"
mk src/pages/parent/Schedule.jsx Schedule "מערכת שעות"
mk src/pages/parent/ReportAbsence.jsx ReportAbsence "דיווח חיסור"
mk src/pages/auth/ForgotPassword.jsx ForgotPassword "שחזור סיסמה"
mk src/pages/auth/ResetPassword.jsx ResetPassword "איפוס סיסמה"

# auth
w src/pages/auth/Login.jsx <<'EOF_FILE'
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { getErrorMessage } from "../../utils/errors.js";
import { ROLE_HOME } from "../../utils/constants.js";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(userId.trim(), password);
      const from = location.state?.from?.pathname;
      // Only honor "from" if it belongs to this user's area.
      const target = from && from.startsWith(ROLE_HOME[u.role]) ? from : ROLE_HOME[u.role];
      navigate(target, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="התחברות">
      <form className="stack" onSubmit={onSubmit}>
        <Input label="תעודת זהות" value={userId} onChange={(e) => setUserId(e.target.value)}
          autoComplete="username" inputMode="numeric" required />
        <Input label="סיסמה" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password" required />
        {error && <p role="alert" style={{ color: "var(--color-danger)" }}>{error}</p>}
        <Button type="submit" loading={loading}>כניסה</Button>
      </form>
    </Card>
  );
}
EOF_FILE

# shared
w src/pages/shared/Profile.jsx <<'EOF_FILE'
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { updateMe } from "../../api/users.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, password: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useApiMutation(updateMe, {
    success: "הפרופיל עודכן",
    onSuccess: (data) => {
      updateUser({ firstName: data.firstName, lastName: data.lastName });
      setForm((f) => ({ ...f, password: "" }));
    },
  });

  function onSubmit(e) {
    e.preventDefault();
    const body = {};
    if (form.firstName !== user.firstName) body.firstName = form.firstName;
    if (form.lastName !== user.lastName) body.lastName = form.lastName;
    if (form.password) body.password = form.password;
    if (Object.keys(body).length > 0) save.mutate(body);
  }

  return (
    <div className="stack">
      <div className="page-header"><h1>פרופיל</h1></div>
      <Card>
        <form className="stack" onSubmit={onSubmit}>
          <p className="muted">ת"ז: {user.userId}</p>
          <Input label="שם פרטי" value={form.firstName} onChange={set("firstName")} />
          <Input label="שם משפחה" value={form.lastName} onChange={set("lastName")} />
          <Input label="סיסמה חדשה (השאר ריק ללא שינוי)" type="password" value={form.password}
            onChange={set("password")} autoComplete="new-password" />
          <Button type="submit" loading={save.isPending}>שמירה</Button>
        </form>
      </Card>
    </div>
  );
}
EOF_FILE

# parent
w src/pages/parent/ChildOverview.jsx <<'EOF_FILE'
import { useMyChild } from "../../hooks/queries.js";
import Card from "../../components/ui/Card.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import GradeChart from "../../components/domain/GradeChart.jsx";
import GradesTable from "../../components/domain/GradesTable.jsx";
import AttendanceList from "../../components/domain/AttendanceList.jsx";
import { fullName } from "../../utils/formatters.js";

export default function ChildOverview() {
  const { data: child, isLoading, error } = useMyChild();

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא נמצאו נתוני תלמיד">לא משויך תלמיד לחשבון זה.</EmptyState>;

  const absences = child.attendance.filter((a) => a.type === "absence").length;
  const lates = child.attendance.filter((a) => a.type === "late").length;

  return (
    <div className="stack">
      <div className="page-header"><h1>{fullName(child)}</h1></div>

      <div className="grid grid-3">
        <Card title="ציונים"><p className="stat">{child.grades.length}</p></Card>
        <Card title="חיסורים"><p className="stat">{absences}</p></Card>
        <Card title="איחורים"><p className="stat">{lates}</p></Card>
      </div>

      <Card title="ממוצע משוקלל לפי מקצוע"><GradeChart averages={child.weightedAverages} /></Card>
      <Card title="ציונים"><GradesTable grades={child.grades} /></Card>
      <Card title="נוכחות"><AttendanceList records={child.attendance} /></Card>
    </div>
  );
}
EOF_FILE

w src/pages/parent/Forms.jsx <<'EOF_FILE'
import { useMyChild } from "../../hooks/queries.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { parentApproveForm } from "../../api/forms.js";
import FormCard from "../../components/domain/FormCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

export default function Forms() {
  const { data: child, isLoading, error } = useMyChild();
  const approve = useApiMutation((title) => parentApproveForm(child.id, title), {
    invalidate: [["myChild"]],
    success: "הטופס אושר",
  });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא נמצאו נתוני תלמיד" />;

  return (
    <div className="stack">
      <div className="page-header"><h1>טפסים לאישור</h1></div>
      {child.forms.length === 0 && <EmptyState title="אין טפסים כרגע" />}
      <div className="grid grid-2">
        {child.forms.map((f) => (
          <FormCard
            key={`${f.title}-${f.deadline}`}
            form={f}
            loading={approve.isPending && approve.variables === f.title}
            onApprove={() => approve.mutate(f.title)}
          />
        ))}
      </div>
    </div>
  );
}
EOF_FILE

# teacher
w src/pages/teacher/MyClass.jsx <<'EOF_FILE'
import { useMyClass } from "../../hooks/queries.js";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/domain/RiskBadge.jsx";
import { fullName } from "../../utils/formatters.js";

export default function MyClass() {
  const { data, isLoading, error } = useMyClass();
  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא משויכת אליך כיתה פעילה">פנה להנהלה.</EmptyState>;

  return (
    <div className="stack">
      <div className="page-header"><h1>כיתה {data.className}</h1><span className="muted">{data.students.length} תלמידים</span></div>
      {data.students.length === 0 ? <EmptyState title="אין תלמידים בכיתה" /> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>תלמיד</th><th>ת"ז</th><th>ציונים</th><th>חיסורים</th><th>מדד סיכון</th></tr></thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.id}>
                  <td data-label="תלמיד">{fullName(s)}</td>
                  <td data-label='ת"ז'>{s.studentId}</td>
                  <td data-label="ציונים">{s.grades.length}</td>
                  <td data-label="חיסורים">{s.attendance.filter((a) => a.type === "absence").length}</td>
                  <td data-label="מדד סיכון"><RiskBadge value={s.academicRiskIndex} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
EOF_FILE

w src/pages/teacher/Grades.jsx <<'EOF_FILE'
import { useState } from "react";
import { useMyClass } from "../../hooks/queries.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { addGrade, updateGrade } from "../../api/grades.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import StudentSelect from "../../components/domain/StudentSelect.jsx";
import GradesTable from "../../components/domain/GradesTable.jsx";
import { todayInput } from "../../utils/formatters.js";

const EMPTY = { subject: "", taskName: "", score: "", weight: "0.2", date: todayInput() };

export default function Grades() {
  const { data, isLoading, error } = useMyClass();
  const [studentId, setStudentId] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [score, setScore] = useState("");

  const students = data?.students ?? [];
  const student = students.find((s) => s.id === studentId) ?? students[0];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const add = useApiMutation((body) => addGrade(student.id, body), {
    invalidate: [["myClass"]], success: "הציון נוסף",
    onSuccess: () => setForm((f) => ({ ...f, taskName: "", score: "" })),
  });
  const update = useApiMutation((body) => updateGrade(student.id, body), {
    invalidate: [["myClass"]], success: "הציון עודכן", onSuccess: () => setEditing(null),
  });

  if (isLoading) return <Spinner />;
  if (error || students.length === 0) return <EmptyState title="אין תלמידים בכיתה" />;

  function onAdd(e) {
    e.preventDefault();
    add.mutate({ ...form, score: Number(form.score), weight: Number(form.weight) });
  }

  return (
    <div className="stack">
      <div className="page-header"><h1>ציונים</h1></div>
      <StudentSelect students={students} value={student.id} onChange={setStudentId} />

      <Card title="הוספת ציון">
        <form className="stack" onSubmit={onAdd}>
          <div className="grid grid-2">
            <Input label="מקצוע" value={form.subject} onChange={set("subject")} required />
            <Input label="שם המטלה" value={form.taskName} onChange={set("taskName")} required />
            <Input label="ציון (0-100)" type="number" min="0" max="100" value={form.score} onChange={set("score")} required />
            <Input label="משקל (0-1)" type="number" min="0" max="1" step="0.05" value={form.weight} onChange={set("weight")} required />
            <Input label="תאריך" type="date" value={form.date} onChange={set("date")} required />
          </div>
          <Button type="submit" loading={add.isPending}>הוספה</Button>
        </form>
      </Card>

      <Card title="ציוני התלמיד">
        <GradesTable
          grades={student.grades}
          renderActions={(g) => (
            <Button variant="secondary" onClick={() => { setEditing(g); setScore(String(g.score)); }}>עדכון</Button>
          )}
        />
      </Card>

      <Modal open={Boolean(editing)} title="עדכון ציון" onClose={() => setEditing(null)}>
        {editing && (
          <form className="stack" onSubmit={(e) => {
            e.preventDefault();
            update.mutate({ subject: editing.subject, date: editing.date, taskName: editing.taskName, score: Number(score) });
          }}>
            <p className="muted">{editing.subject} · {editing.taskName}</p>
            <Input label="ציון חדש" type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} required />
            <Button type="submit" loading={update.isPending}>שמירה</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
EOF_FILE

w src/pages/teacher/Attendance.jsx <<'EOF_FILE'
import { useState } from "react";
import { useMyClass } from "../../hooks/queries.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { addAttendance, updateAttendance } from "../../api/attendance.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import StudentSelect from "../../components/domain/StudentSelect.jsx";
import AttendanceList from "../../components/domain/AttendanceList.jsx";
import { todayInput } from "../../utils/formatters.js";

export default function Attendance() {
  const { data, isLoading, error } = useMyClass();
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(todayInput());
  const [type, setType] = useState("absence");

  const students = data?.students ?? [];
  const student = students.find((s) => s.id === studentId) ?? students[0];

  const add = useApiMutation((body) => addAttendance(student.id, body), {
    invalidate: [["myClass"]], success: "הנוכחות נרשמה",
  });
  const update = useApiMutation((body) => updateAttendance(student.id, body), {
    invalidate: [["myClass"]], success: "הרישום עודכן",
  });

  if (isLoading) return <Spinner />;
  if (error || students.length === 0) return <EmptyState title="אין תלמידים בכיתה" />;

  return (
    <div className="stack">
      <div className="page-header"><h1>נוכחות</h1></div>
      <StudentSelect students={students} value={student.id} onChange={setStudentId} />

      <Card title="רישום חיסור / איחור">
        <form className="stack" onSubmit={(e) => { e.preventDefault(); add.mutate({ date, type }); }}>
          <div className="grid grid-2">
            <Input label="תאריך" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Select label="סוג" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="absence">חיסור</option>
              <option value="late">איחור</option>
            </Select>
          </div>
          <Button type="submit" loading={add.isPending}>רישום</Button>
        </form>
      </Card>

      <Card title="היסטוריית נוכחות">
        <AttendanceList
          records={student.attendance}
          renderActions={(r) => (
            <Button variant="secondary" loading={update.isPending}
              onClick={() => update.mutate({ date: r.date, type: r.type === "absence" ? "late" : "absence" })}>
              הפוך ל{r.type === "absence" ? "איחור" : "חיסור"}
            </Button>
          )}
        />
      </Card>
    </div>
  );
}
EOF_FILE

w src/pages/teacher/Forms.jsx <<'EOF_FILE'
import { useState } from "react";
import { useMyClass } from "../../hooks/queries.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { teacherCreateForm, teacherUpdateForm } from "../../api/forms.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { formatDate, toDateInput, todayInput } from "../../utils/formatters.js";

/** Every student holds a copy of each form; group copies by title + deadline. */
function aggregate(students) {
  const map = new Map();
  for (const s of students) {
    for (const f of s.forms ?? []) {
      const key = `${f.title}|${new Date(f.deadline).getTime()}`;
      const entry = map.get(key) ?? { ...f, total: 0, approved: 0 };
      entry.total += 1;
      if (f.isApproved) entry.approved += 1;
      map.set(key, entry);
    }
  }
  return [...map.values()];
}

export default function Forms() {
  const { data, isLoading, error } = useMyClass();
  const [form, setForm] = useState({ title: "", description: "", deadline: todayInput() });
  const [editing, setEditing] = useState(null);
  const [edit, setEdit] = useState({ description: "", newDeadline: "" });

  const create = useApiMutation(teacherCreateForm, {
    invalidate: [["myClass"]], success: "הטופס הופץ לכל הכיתה",
    onSuccess: () => setForm({ title: "", description: "", deadline: todayInput() }),
  });
  const update = useApiMutation(teacherUpdateForm, {
    invalidate: [["myClass"]], success: "הטופס עודכן", onSuccess: () => setEditing(null),
  });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא משויכת אליך כיתה פעילה" />;

  const forms = aggregate(data.students);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function openEdit(f) {
    setEditing(f);
    setEdit({ description: f.description, newDeadline: toDateInput(f.deadline) });
  }

  function onUpdate(e) {
    e.preventDefault();
    const body = { title: editing.title, deadline: editing.deadline };
    if (edit.description !== editing.description) body.description = edit.description;
    if (edit.newDeadline !== toDateInput(editing.deadline)) body.newDeadline = edit.newDeadline;
    if (Object.keys(body).length === 2) return setEditing(null);
    update.mutate(body);
  }

  return (
    <div className="stack">
      <div className="page-header"><h1>טפסים</h1></div>

      <Card title="טופס חדש (יופץ לכל תלמידי הכיתה)">
        <form className="stack" onSubmit={(e) => { e.preventDefault(); create.mutate(form); }}>
          <Input label="כותרת" value={form.title} onChange={set("title")} required />
          <Input as="textarea" label="תוכן הטופס" value={form.description} onChange={set("description")} required />
          <Input label="יעד אחרון לאישור" type="date" value={form.deadline} onChange={set("deadline")} required />
          <Button type="submit" loading={create.isPending}>הפצה</Button>
        </form>
      </Card>

      <Card title="טפסים שהופצו">
        {forms.length === 0 ? <p className="muted">עדיין לא הופצו טפסים</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>כותרת</th><th>יעד אחרון</th><th>אישורים</th><th /></tr></thead>
              <tbody>
                {forms.map((f) => (
                  <tr key={`${f.title}-${f.deadline}`}>
                    <td data-label="כותרת">{f.title}</td>
                    <td data-label="יעד אחרון">{formatDate(f.deadline)}</td>
                    <td data-label="אישורים">{f.approved} / {f.total}</td>
                    <td><Button variant="secondary" onClick={() => openEdit(f)}>עריכה</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={Boolean(editing)} title="עריכת טופס" onClose={() => setEditing(null)}>
        {editing && (
          <form className="stack" onSubmit={onUpdate}>
            <p className="muted">{editing.title}</p>
            <Input as="textarea" label="תוכן" value={edit.description} onChange={(e) => setEdit((x) => ({ ...x, description: e.target.value }))} />
            <Input label="יעד אחרון" type="date" value={edit.newDeadline} onChange={(e) => setEdit((x) => ({ ...x, newDeadline: e.target.value }))} />
            <Button type="submit" loading={update.isPending}>שמירה</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
EOF_FILE

w src/pages/teacher/RiskAlerts.jsx <<'EOF_FILE'
import { useMyClass } from "../../hooks/queries.js";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/domain/RiskBadge.jsx";
import { RISK_WARNING } from "../../utils/constants.js";
import { fullName } from "../../utils/formatters.js";

export default function RiskAlerts() {
  const { data, isLoading, error } = useMyClass();
  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא משויכת אליך כיתה פעילה" />;

  const atRisk = data.students
    .filter((s) => s.academicRiskIndex >= RISK_WARNING)
    .sort((a, b) => b.academicRiskIndex - a.academicRiskIndex);

  return (
    <div className="stack">
      <div className="page-header"><h1>תלמידים בסיכון אקדמי</h1></div>
      {atRisk.length === 0 ? (
        <EmptyState title="אין תלמידים בסיכון">כל התלמידים מתחת לסף האזהרה.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>תלמיד</th><th>מדד סיכון</th></tr></thead>
            <tbody>
              {atRisk.map((s) => (
                <tr key={s.id}>
                  <td data-label="תלמיד">{fullName(s)}</td>
                  <td data-label="מדד סיכון"><RiskBadge value={s.academicRiskIndex} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
EOF_FILE

# admin
w src/pages/admin/Dashboard.jsx <<'EOF_FILE'
import { useQuery } from "@tanstack/react-query";
import { adminListUsers } from "../../api/users.js";
import { staffListClasses } from "../../api/classes.js";
import { adminListStudents } from "../../api/students.js";
import Card from "../../components/ui/Card.jsx";

export default function Dashboard() {
  const users = useQuery({ queryKey: ["adminUsers", {}], queryFn: () => adminListUsers({}) });
  const classes = useQuery({ queryKey: ["classes", { isActive: "true" }], queryFn: () => staffListClasses({ isActive: "true" }) });
  const students = useQuery({ queryKey: ["adminStudents"], queryFn: adminListStudents });

  const stat = (q) => (q.isLoading ? "…" : q.data?.length ?? "—");
  return (
    <div className="stack">
      <div className="page-header"><h1>לוח בקרה</h1></div>
      <div className="grid grid-3">
        <Card title="משתמשים"><p className="stat">{stat(users)}</p></Card>
        <Card title="כיתות פעילות"><p className="stat">{stat(classes)}</p></Card>
        <Card title="תלמידים"><p className="stat">{stat(students)}</p></Card>
      </div>
      <p className="muted">נתוני שימוש והתפלגויות יתווספו כשייבנה שירות האנליטיקה.</p>
    </div>
  );
}
EOF_FILE

w src/pages/admin/Users.jsx <<'EOF_FILE'
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminListUsers, adminRegister, adminUpdateUser } from "../../api/users.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { ROLE_LABEL } from "../../utils/constants.js";
import { fullName } from "../../utils/formatters.js";

function UserForm({ user, onDone }) {
  const isNew = !user.id;
  const [f, setF] = useState({
    userId: user.userId ?? "", password: "", role: user.role ?? "parent",
    firstName: user.firstName ?? "", lastName: user.lastName ?? "",
  });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = useApiMutation(
    (body) => (isNew ? adminRegister(body) : adminUpdateUser(user.id, body)),
    { invalidate: [["adminUsers"]], success: isNew ? "המשתמש נוצר" : "המשתמש עודכן", onSuccess: onDone },
  );

  function onSubmit(e) {
    e.preventDefault();
    if (isNew) save.mutate(f);
    else save.mutate({ role: f.role, firstName: f.firstName, lastName: f.lastName });
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      {isNew && <Input label="תעודת זהות" value={f.userId} onChange={set("userId")} required />}
      {isNew && <Input label="סיסמה ראשונית" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" required minLength={8} />}
      <Input label="שם פרטי" value={f.firstName} onChange={set("firstName")} required />
      <Input label="שם משפחה" value={f.lastName} onChange={set("lastName")} required />
      <Select label="תפקיד" value={f.role} onChange={set("role")}>
        {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
      <Button type="submit" loading={save.isPending}>שמירה</Button>
    </form>
  );
}

export default function Users() {
  const [filters, setFilters] = useState({ role: "", fullName: "", isActive: "" });
  const [editing, setEditing] = useState(null); // {} = new user

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["adminUsers", params],
    queryFn: () => adminListUsers(params),
  });

  const toggle = useApiMutation((u) => adminUpdateUser(u.id, { isActive: !u.isActive }), {
    invalidate: [["adminUsers"]],
    success: "הסטטוס עודכן",
  });

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="stack">
      <div className="page-header">
        <h1>משתמשים</h1>
        <Button onClick={() => setEditing({})}>משתמש חדש</Button>
      </div>

      <div className="toolbar">
        <Input label="חיפוש לפי שם" value={filters.fullName} onChange={setFilter("fullName")} />
        <Select label="תפקיד" value={filters.role} onChange={setFilter("role")}>
          <option value="">הכל</option>
          {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Select label="סטטוס" value={filters.isActive} onChange={setFilter("isActive")}>
          <option value="">הכל</option>
          <option value="true">פעיל</option>
          <option value="false">מושעה</option>
        </Select>
      </div>

      {isLoading && <Spinner />}
      {error && <EmptyState title="שגיאה בטעינת המשתמשים" />}
      {users && users.length === 0 && <EmptyState title="לא נמצאו משתמשים" />}
      {users && users.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>שם</th><th>ת"ז</th><th>תפקיד</th><th>סטטוס</th><th /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="שם">{fullName(u)}</td>
                  <td data-label='ת"ז'>{u.userId}</td>
                  <td data-label="תפקיד">{ROLE_LABEL[u.role]}</td>
                  <td data-label="סטטוס"><Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "פעיל" : "מושעה"}</Badge></td>
                  <td>
                    <div className="row">
                      <Button variant="secondary" onClick={() => setEditing(u)}>עריכה</Button>
                      <Button variant={u.isActive ? "danger" : "secondary"} loading={toggle.isPending && toggle.variables?.id === u.id}
                        onClick={() => toggle.mutate(u)}>
                        {u.isActive ? "השעיה" : "הפעלה"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(editing)} title={editing?.id ? "עריכת משתמש" : "משתמש חדש"} onClose={() => setEditing(null)}>
        {editing && <UserForm user={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
EOF_FILE

w src/pages/admin/Classes.jsx <<'EOF_FILE'
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminCreateClass, adminDeleteClass, staffListClasses } from "../../api/classes.js";
import { adminListUsers } from "../../api/users.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { fullName } from "../../utils/formatters.js";

function CreateClassForm({ onDone }) {
  const [className, setClassName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const { data: teachers = [] } = useQuery({
    queryKey: ["adminUsers", { role: "teacher", isActive: "true" }],
    queryFn: () => adminListUsers({ role: "teacher", isActive: "true" }),
  });
  const create = useApiMutation(adminCreateClass, {
    invalidate: [["classes"]], success: "הכיתה נוצרה", onSuccess: onDone,
  });

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); create.mutate({ teacherId, className }); }}>
      <Input label="שם הכיתה (למשל י'2)" value={className} onChange={(e) => setClassName(e.target.value)} required />
      <Select label="מורה מחנך" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
        <option value="" disabled>בחר מורה</option>
        {teachers.map((t) => <option key={t.id} value={t.userId}>{fullName(t)} ({t.userId})</option>)}
      </Select>
      <Button type="submit" loading={create.isPending}>יצירה</Button>
    </form>
  );
}

export default function Classes() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const params = { isActive: "true", ...(search ? { className: search } : {}) };
  const { data: classes, isLoading, error } = useQuery({
    queryKey: ["classes", params],
    queryFn: () => staffListClasses(params),
  });
  const remove = useApiMutation((id) => adminDeleteClass(id), {
    invalidate: [["classes"], ["adminStudents"]], success: "הכיתה נמחקה", onSuccess: () => setDeleting(null),
  });

  return (
    <div className="stack">
      <div className="page-header">
        <h1>כיתות</h1>
        <Button onClick={() => setCreating(true)}>כיתה חדשה</Button>
      </div>
      <div className="toolbar"><Input label="חיפוש כיתה" value={search} onChange={(e) => setSearch(e.target.value)} /></div>

      {isLoading && <Spinner />}
      {error && <EmptyState title="שגיאה בטעינת הכיתות" />}
      {classes && classes.length === 0 && <EmptyState title="אין כיתות פעילות" />}
      {classes && classes.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>כיתה</th><th>ת"ז מורה</th><th>תלמידים</th><th /></tr></thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c._id}>
                  <td data-label="כיתה">{c.className}</td>
                  <td data-label='ת"ז מורה'>{c.teacherId}</td>
                  <td data-label="תלמידים">{c.studentsCount}</td>
                  <td>
                    <div className="row">
                      <Link to={`/admin/classes/${c._id}`}><Button variant="secondary">תלמידים</Button></Link>
                      <Button variant="danger" onClick={() => setDeleting(c)}>מחיקה</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} title="כיתה חדשה" onClose={() => setCreating(false)}>
        {creating && <CreateClassForm onDone={() => setCreating(false)} />}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)} title="מחיקת כיתה"
        message={`למחוק את הכיתה ${deleting?.className ?? ""}?`}
        loading={remove.isPending} confirmLabel="מחיקה"
        onConfirm={() => remove.mutate(deleting._id)} onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
EOF_FILE

w src/pages/admin/ClassStudents.jsx <<'EOF_FILE'
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminAddStudent, adminDeleteStudent, adminListStudents } from "../../api/students.js";
import { staffListClasses } from "../../api/classes.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/domain/RiskBadge.jsx";
import { fullName } from "../../utils/formatters.js";

export default function ClassStudents() {
  const { classId } = useParams();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [f, setF] = useState({ studentId: "", firstName: "", lastName: "" });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const { data: all, isLoading } = useQuery({ queryKey: ["adminStudents"], queryFn: adminListStudents });
  const { data: classes } = useQuery({
    queryKey: ["classes", { isActive: "true" }],
    queryFn: () => staffListClasses({ isActive: "true" }),
  });

  const className = classes?.find((c) => c._id === classId)?.className ?? "";
  const students = (all ?? []).filter((s) => s.classId === classId);

  const add = useApiMutation((body) => adminAddStudent(classId, body), {
    invalidate: [["adminStudents"], ["classes"]], success: "התלמיד נוסף",
    onSuccess: () => { setAdding(false); setF({ studentId: "", firstName: "", lastName: "" }); },
  });
  const remove = useApiMutation((id) => adminDeleteStudent(classId, id), {
    invalidate: [["adminStudents"], ["classes"]], success: "התלמיד הוסר", onSuccess: () => setRemoving(null),
  });

  return (
    <div className="stack">
      <div className="page-header">
        <h1>כיתה {className}</h1>
        <div className="row">
          <Link to="/admin/classes"><Button variant="secondary">חזרה</Button></Link>
          <Button onClick={() => setAdding(true)}>הוספת תלמיד</Button>
        </div>
      </div>

      {isLoading && <Spinner />}
      {!isLoading && students.length === 0 && <EmptyState title="אין תלמידים בכיתה" />}
      {students.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>תלמיד</th><th>ת"ז</th><th>מדד סיכון</th><th /></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td data-label="תלמיד">{fullName(s)}</td>
                  <td data-label='ת"ז'>{s.studentId}</td>
                  <td data-label="מדד סיכון"><RiskBadge value={s.academicRiskIndex} /></td>
                  <td><Button variant="danger" onClick={() => setRemoving(s)}>הסרה</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={adding} title="הוספת תלמיד" onClose={() => setAdding(false)}>
        {adding && (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); add.mutate(f); }}>
            <Input label="תעודת זהות" value={f.studentId} onChange={set("studentId")} required />
            <Input label="שם פרטי" value={f.firstName} onChange={set("firstName")} required />
            <Input label="שם משפחה" value={f.lastName} onChange={set("lastName")} required />
            <Button type="submit" loading={add.isPending}>הוספה</Button>
          </form>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(removing)} title="הסרת תלמיד"
        message={`להסיר את ${removing ? fullName(removing) : ""}? כל הציונים והנוכחות שלו יימחקו.`}
        confirmLabel="הסרה" loading={remove.isPending}
        onConfirm={() => remove.mutate(removing.id)} onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
EOF_FILE

# ---------- 11. main.jsx ו-App.jsx ----------
w src/main.jsx <<'EOF_FILE'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/utilities.css";
import "./styles/table.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
EOF_FILE

w src/App.jsx <<'EOF_FILE'
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import RoleRoute from "./routes/RoleRoute.jsx";
import AuthLayout from "./layouts/AuthLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import TeacherLayout from "./layouts/TeacherLayout.jsx";
import ParentLayout from "./layouts/ParentLayout.jsx";
import { ROLE_HOME } from "./utils/constants.js";

import Login from "./pages/auth/Login.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import Profile from "./pages/shared/Profile.jsx";
import Chat from "./pages/shared/Chat.jsx";
import Notifications from "./pages/shared/Notifications.jsx";

import Dashboard from "./pages/admin/Dashboard.jsx";
import Users from "./pages/admin/Users.jsx";
import Classes from "./pages/admin/Classes.jsx";
import ClassStudents from "./pages/admin/ClassStudents.jsx";
import Announcements from "./pages/admin/Announcements.jsx";

import MyClass from "./pages/teacher/MyClass.jsx";
import Grades from "./pages/teacher/Grades.jsx";
import Attendance from "./pages/teacher/Attendance.jsx";
import TeacherForms from "./pages/teacher/Forms.jsx";
import RiskAlerts from "./pages/teacher/RiskAlerts.jsx";

import ChildOverview from "./pages/parent/ChildOverview.jsx";
import ParentForms from "./pages/parent/Forms.jsx";
import Schedule from "./pages/parent/Schedule.jsx";
import ReportAbsence from "./pages/parent/ReportAbsence.jsx";

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user.role]} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<RoleRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classes/:classId" element={<ClassStudents />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<RoleRoute roles={["teacher"]} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<MyClass />} />
            <Route path="grades" element={<Grades />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="forms" element={<TeacherForms />} />
            <Route path="risk" element={<RiskAlerts />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<RoleRoute roles={["parent"]} />}>
          <Route path="/parent" element={<ParentLayout />}>
            <Route index element={<ChildOverview />} />
            <Route path="forms" element={<ParentForms />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="report-absence" element={<ReportAbsence />} />
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
EOF_FILE

echo ""
echo "✔ כל קבצי ה-client נוצרו."
echo "נשאר לעשות בשרת (סעיף 12 במייל):"
echo "  1. ב-server/src/app.js: import apiRouter from \"./routes/index.js\"; app.use(\"/api\", apiRouter);  (לפני ה-handler של 404)"
echo "  2. ב-services/studentService.js בתוך getMyChild: להוסיף  id: student.id,"
echo "הרצה: cd client && npm run dev"