import Badge from "../ui/Badge.jsx";
import { RISK_ALERT, RISK_WARNING } from "../../utils/constants.js";
import { formatNumber } from "../../utils/formatters.js";

/** Text + color together, so meaning never depends on color alone. */
export default function RiskBadge({ value = 0 }) {
  let tone = "success", label = "תקין";
  if (value >= RISK_ALERT) { tone = "danger"; label = "סיכון גבוה"; }
  else if (value >= RISK_WARNING) { tone = "warning"; label = "אזהרה"; }
  return <Badge tone={tone}>{label} · {formatNumber(value)}</Badge>;
}
