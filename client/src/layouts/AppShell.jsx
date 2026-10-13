import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, X, GraduationCap, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import Button from "../components/ui/Button.jsx";
import NotificationBell from "../components/domain/NotificationBell.jsx";
import ThemeToggle from "../components/ui/ThemeToggle.jsx";
import { ROLE_LABEL } from "../utils/constants.js";
import styles from "./AppShell.module.css";

/**
 * Shared application shell.
 * Desktop: sticky topbar + fixed sidebar.
 * Mobile: drawer, or bottom nav bar for parent role.
 */
export default function AppShell({ nav, bottomNav = false }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  const renderLinks = (cls, isBottom = false) =>
    nav.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `${cls} ${isActive ? styles.active : ""}`}
        >
          {Icon && <Icon size={isBottom ? 20 : 18} className={styles.navIcon} />}
          <span className={styles.navLabel}>{item.label}</span>
        </NavLink>
      );
    });

  return (
    <div className={`${styles.shell} ${bottomNav ? styles.hasBottom : ""}`}>
      <header className={styles.topbar}>
        <div className={styles.topbarStart}>
          {!bottomNav && (
            <button
              className={styles.menuBtn}
              aria-label="תפריט ניווט"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          <div className={styles.brand}>
            <GraduationCap size={22} className={styles.brandIcon} />
            <span className={styles.brandText}>HomeRoom</span>
          </div>
        </div>

        <div className={styles.topbarEnd}>
          <ThemeToggle />
          <NotificationBell />

          <div className={styles.userSection}>
            <span className={styles.avatar} aria-hidden="true">
              {initials || "HR"}
            </span>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {user.firstName} {user.lastName}
              </span>
              <span className={styles.userRole}>{ROLE_LABEL[user.role]}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className={styles.logoutBtn}
            title="יציאה מהמערכת"
          >
            <LogOut size={16} />
            <span className={styles.logoutText}>יציאה</span>
          </Button>
        </div>
      </header>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <nav className={styles.sidebarNav}>
          {renderLinks(styles.link)}
        </nav>
      </aside>

      <main className={`${styles.main} route-fade-enter`} key={pathname}>
        <Outlet />
      </main>

      {bottomNav && (
        <nav className={styles.bottomNav}>
          {renderLinks(styles.bLink, true)}
        </nav>
      )}
    </div>
  );
}
