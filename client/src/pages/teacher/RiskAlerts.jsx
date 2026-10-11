import { useMyClass } from "../../hooks/queries.js";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/domain/RiskBadge.jsx";
import { RISK_WARNING } from "../../utils/constants.js";
import { fullName } from "../../utils/formatters.js";

export default function RiskAlerts() {
  const { data, isLoading, error } = useMyClass();
  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא משויכת אליך כיתה פעילה" />;

  const atRisk = data.students
    .filter((s) => s.academicRiskIndex >= RISK_WARNING)
    .sort((a, b) => b.academicRiskIndex - a.academicRiskIndex);

  return (
    <div className="stack">
      <div className="page-header"><h1>תלמידים בסיכון אקדמי</h1></div>
      {atRisk.length === 0 ? (
        <EmptyState title="אין תלמידים בסיכון">כל התלמידים מתחת לסף האזהרה.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>תלמיד</th><th>מדד סיכון</th></tr></thead>
            <tbody>
              {atRisk.map((s) => (
                <tr key={s.id}>
                  <td data-label="תלמיד">{fullName(s)}</td>
                  <td data-label="מדד סיכון"><RiskBadge value={s.academicRiskIndex} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
