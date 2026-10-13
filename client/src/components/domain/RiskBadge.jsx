import Badge from "../ui/Badge.jsx";
import { RISK_ALERT, RISK_WARNING } from "../../utils/constants.js";
import { formatNumber } from "../../utils/formatters.js";

/** Text + color together, so meaning never depends on color alone. */
export default function RiskBadge({ value = 0, onClick }) {
  let tone = "success", label = "תקין";
  if (value >= RISK_ALERT) { tone = "danger"; label = "סיכון גבוה"; }
  else if (value >= RISK_WARNING) { tone = "warning"; label = "אזהרה"; }

  const badgeContent = <Badge tone={tone}>{label} · {formatNumber(value)}</Badge>;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
          textAlign: "inherit",
          font: "inherit",
        }}
        title="לחצו להסבר על חישוב המדד"
        aria-label={`מדד סיכון ${formatNumber(value)}, ${label}. לחצו להסבר חישוב המדד.`}
      >
        {badgeContent}
      </button>
    );
  }

  return badgeContent;
}