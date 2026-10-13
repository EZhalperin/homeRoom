import {
  LayoutDashboard,
  Users,
  Megaphone,
  Award,
  CalendarCheck,
  FileText,
  AlertTriangle,
  MessageSquare,
  User,
} from "lucide-react";
import AppShell from "./AppShell.jsx";

const NAV = [
  { to: "/teacher", label: "לוח בקרה", icon: LayoutDashboard, end: true },
  { to: "/teacher/class", label: "הכיתה שלי", icon: Users },
  { to: "/teacher/announcements", label: "הודעות לכיתה", icon: Megaphone },
  { to: "/teacher/grades", label: "ציונים", icon: Award },
  { to: "/teacher/attendance", label: "נוכחות", icon: CalendarCheck },
  { to: "/teacher/forms", label: "טפסים", icon: FileText },
  { to: "/teacher/risk", label: "תלמידים בסיכון", icon: AlertTriangle },
  { to: "/teacher/chat", label: "צ'אט", icon: MessageSquare },
  { to: "/teacher/profile", label: "פרופיל", icon: User },
];

export default function TeacherLayout() {
  return <AppShell nav={NAV} />;
}
