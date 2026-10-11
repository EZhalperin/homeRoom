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
