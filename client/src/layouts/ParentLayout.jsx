import {
  LayoutDashboard,
  Megaphone,
  FileText,
  MessageSquare,
  User,
} from "lucide-react";
import AppShell from "./AppShell.jsx";

const NAV = [
  { to: "/parent", label: "סקירה", icon: LayoutDashboard, end: true },
  { to: "/parent/announcements", label: "הודעות", icon: Megaphone },
  { to: "/parent/forms", label: "טפסים", icon: FileText },
  { to: "/parent/chat", label: "צ'אט", icon: MessageSquare },
  { to: "/parent/profile", label: "פרופיל", icon: User },
];

export default function ParentLayout() {
  return <AppShell nav={NAV} bottomNav />;
}
