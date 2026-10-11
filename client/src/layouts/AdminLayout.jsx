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
