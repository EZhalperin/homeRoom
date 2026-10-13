// Dates are stored as UTC midnight, so display in UTC to avoid off-by-one-day.
const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium", timeZone: "UTC" });

export const formatDate = (v) => (v ? dateFmt.format(new Date(v)) : "—");
export const toDateInput = (v) => new Date(v).toISOString().slice(0, 10);
export const todayInput = () => new Date().toISOString().slice(0, 10);
export const formatNumber = (n, digits = 1) =>
  typeof n === "number" ? n.toFixed(digits) : "—";
export const fullName = (p) => `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();

export const formatDateTime = (v) => {
  if (!v) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(v));
};

export const formatRelativeTime = (v) => {
  if (!v) return "—";
  const date = new Date(v);
  const now = new Date();
  const diffSec = Math.round((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "עכשיו";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `לפני ${diffHours} שע'`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "אתמול";
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return formatDate(v);
};