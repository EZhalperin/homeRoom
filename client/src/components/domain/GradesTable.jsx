import { formatDate } from "../../utils/formatters.js";

/** @param {{ grades: any[], renderActions?: (g:any)=>React.ReactNode }} props */
export default function GradesTable({ grades = [], renderActions }) {
  const sorted = [...grades].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sorted.length === 0) return <p className="muted">אין ציונים</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>מקצוע</th><th>מטלה</th><th>ציון</th><th>משקל</th><th>תאריך</th>{renderActions && <th />}</tr>
        </thead>
        <tbody>
          {sorted.map((g, i) => (
            <tr key={`${g.subject}-${g.taskName}-${g.date}-${i}`}>
              <td data-label="מקצוע">{g.subject}</td>
              <td data-label="מטלה">{g.taskName}</td>
              <td data-label="ציון">{g.score}</td>
              <td data-label="משקל">{Math.round(g.weight * 100)}%</td>
              <td data-label="תאריך">{formatDate(g.date)}</td>
              {renderActions && <td>{renderActions(g)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
