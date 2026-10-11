// Dates are stored as UTC midnight, so display in UTC to avoid off-by-one-day.
const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium", timeZone: "UTC" });

export const formatDate = (v) => (v ? dateFmt.format(new Date(v)) : "—");
export const toDateInput = (v) => new Date(v).toISOString().slice(0, 10);
export const todayInput = () => new Date().toISOString().slice(0, 10);
export const formatNumber = (n, digits = 1) =>
  typeof n === "number" ? n.toFixed(digits) : "—";
export const fullName = (p) => `${p?.firstName ?? ""} ${p?.lastName ?? ""}`.trim();
