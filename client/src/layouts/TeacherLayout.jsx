import AppShell from "./AppShell.jsx";

const NAV = [
  { to: "/teacher", label: "הכיתה שלי", end: true },
  { to: "/teacher/announcements", label: "לוח מודעות" },
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