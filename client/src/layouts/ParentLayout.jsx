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
