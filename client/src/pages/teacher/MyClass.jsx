import { useState } from "react";
import { useMyClass } from "../../hooks/queries.js";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/domain/RiskBadge.jsx";
import RiskExplanationModal from "../../components/domain/RiskExplanationModal.jsx";
import { fullName } from "../../utils/formatters.js";

export default function MyClass() {
  const { data, isLoading, error } = useMyClass();
  const [selectedStudentForRisk, setSelectedStudentForRisk] = useState(null);

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא משויכת אליך כיתה פעילה">פנה להנהלה.</EmptyState>;

  return (
    <div className="stack">
      <div className="page-header">
        <h1>כיתה {data.className}</h1>
        <span className="muted">{data.students.length} תלמידים</span>
      </div>
      {data.students.length === 0 ? (
        <EmptyState title="אין תלמידים בכיתה" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>תלמיד</th>
                <th>ת"ז</th>
                <th>ציונים</th>
                <th>חיסורים</th>
                <th>מדד סיכון</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.id}>
                  <td data-label="תלמיד">{fullName(s)}</td>
                  <td data-label='ת"ז'>{s.studentId}</td>
                  <td data-label="ציונים">{s.grades?.length || 0}</td>
                  <td data-label="חיסורים">
                    {(s.attendance || []).filter((a) => a.type === "absence").length}
                  </td>
                  <td data-label="מדד סיכון">
                    <RiskBadge
                      value={s.academicRiskIndex}
                      onClick={() => setSelectedStudentForRisk(s)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RiskExplanationModal
        open={Boolean(selectedStudentForRisk)}
        student={selectedStudentForRisk}
        onClose={() => setSelectedStudentForRisk(null)}
      />
    </div>
  );
}