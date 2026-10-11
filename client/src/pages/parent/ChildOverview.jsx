import { useMyChild } from "../../hooks/queries.js";
import Card from "../../components/ui/Card.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import GradeChart from "../../components/domain/GradeChart.jsx";
import GradesTable from "../../components/domain/GradesTable.jsx";
import AttendanceList from "../../components/domain/AttendanceList.jsx";
import { fullName } from "../../utils/formatters.js";

export default function ChildOverview() {
  const { data: child, isLoading, error } = useMyChild();

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא נמצאו נתוני תלמיד">לא משויך תלמיד לחשבון זה.</EmptyState>;

  const absences = child.attendance.filter((a) => a.type === "absence").length;
  const lates = child.attendance.filter((a) => a.type === "late").length;

  return (
    <div className="stack">
      <div className="page-header"><h1>{fullName(child)}</h1></div>

      <div className="grid grid-3">
        <Card title="ציונים"><p className="stat">{child.grades.length}</p></Card>
        <Card title="חיסורים"><p className="stat">{absences}</p></Card>
        <Card title="איחורים"><p className="stat">{lates}</p></Card>
      </div>

      <Card title="ממוצע משוקלל לפי מקצוע"><GradeChart averages={child.weightedAverages} /></Card>
      <Card title="ציונים"><GradesTable grades={child.grades} /></Card>
      <Card title="נוכחות"><AttendanceList records={child.attendance} /></Card>
    </div>
  );
}
