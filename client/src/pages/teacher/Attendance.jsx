import { useState } from "react";
import { useMyClass } from "../../hooks/queries.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { addAttendance, updateAttendance } from "../../api/attendance.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import StudentSelect from "../../components/domain/StudentSelect.jsx";
import AttendanceList from "../../components/domain/AttendanceList.jsx";
import { todayInput } from "../../utils/formatters.js";

export default function Attendance() {
  const { data, isLoading, error } = useMyClass();
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(todayInput());
  const [type, setType] = useState("absence");

  const students = data?.students ?? [];
  const student = students.find((s) => s.id === studentId) ?? students[0];

  const add = useApiMutation((body) => addAttendance(student.id, body), {
    invalidate: [["myClass"]], success: "הנוכחות נרשמה",
  });
  const update = useApiMutation((body) => updateAttendance(student.id, body), {
    invalidate: [["myClass"]], success: "הרישום עודכן",
  });

  if (isLoading) return <Spinner />;
  if (error || students.length === 0) return <EmptyState title="אין תלמידים בכיתה" />;

  return (
    <div className="stack">
      <div className="page-header"><h1>נוכחות</h1></div>
      <StudentSelect students={students} value={student.id} onChange={setStudentId} />

      <Card title="רישום חיסור / איחור">
        <form className="stack" onSubmit={(e) => { e.preventDefault(); add.mutate({ date, type }); }}>
          <div className="grid grid-2">
            <Input label="תאריך" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <Select label="סוג" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="absence">חיסור</option>
              <option value="late">איחור</option>
            </Select>
          </div>
          <Button type="submit" loading={add.isPending}>רישום</Button>
        </form>
      </Card>

      <Card title="היסטוריית נוכחות">
        <AttendanceList
          records={student.attendance}
          renderActions={(r) => (
            <Button variant="secondary" loading={update.isPending}
              onClick={() => update.mutate({ date: r.date, type: r.type === "absence" ? "late" : "absence" })}>
              הפוך ל{r.type === "absence" ? "איחור" : "חיסור"}
            </Button>
          )}
        />
      </Card>
    </div>
  );
}
