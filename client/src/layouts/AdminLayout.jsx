import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Megaphone,
  Bell,
  User,
} from "lucide-react";
import AppShell from "./AppShell.jsx";

const NAV = [
  { to: "/admin", label: "לוח בקרה", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "משתמשים", icon: Users },
  { to: "/admin/classes", label: "כיתות", icon: GraduationCap },
  { to: "/admin/announcements", label: "הודעות גלובליות", icon: Megaphone },
  { to: "/admin/notifications", label: "התראות", icon: Bell },
  { to: "/admin/profile", label: "פרופיל", icon: User },
];

export default function AdminLayout() {
  return <AppShell nav={NAV} />;
}
