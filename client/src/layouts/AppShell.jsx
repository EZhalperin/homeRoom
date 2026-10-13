import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Button from "../components/ui/Button.jsx";
import NotificationBell from "../components/domain/NotificationBell.jsx";
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
        <NotificationBell />
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