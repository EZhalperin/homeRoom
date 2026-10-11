import Badge from "../ui/Badge.jsx";
import { ATTENDANCE_LABEL } from "../../utils/constants.js";
import { formatDate } from "../../utils/formatters.js";

export default function AttendanceList({ records = [], renderActions }) {
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sorted.length === 0) return <p className="muted">אין רישומי נוכחות</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>תאריך</th><th>סוג</th>{renderActions && <th />}</tr></thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={`${r.date}-${r.type}-${i}`}>
              <td data-label="תאריך">{formatDate(r.date)}</td>
              <td data-label="סוג">
                <Badge tone={r.type === "absence" ? "danger" : "warning"}>{ATTENDANCE_LABEL[r.type]}</Badge>
              </td>
              {renderActions && <td>{renderActions(r)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
