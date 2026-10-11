import { useQuery } from "@tanstack/react-query";
import { adminListUsers } from "../../api/users.js";
import { staffListClasses } from "../../api/classes.js";
import { adminListStudents } from "../../api/students.js";
import Card from "../../components/ui/Card.jsx";

export default function Dashboard() {
  const users = useQuery({ queryKey: ["adminUsers", {}], queryFn: () => adminListUsers({}) });
  const classes = useQuery({ queryKey: ["classes", { isActive: "true" }], queryFn: () => staffListClasses({ isActive: "true" }) });
  const students = useQuery({ queryKey: ["adminStudents"], queryFn: adminListStudents });

  const stat = (q) => (q.isLoading ? "…" : q.data?.length ?? "—");
  return (
    <div className="stack">
      <div className="page-header"><h1>לוח בקרה</h1></div>
      <div className="grid grid-3">
        <Card title="משתמשים"><p className="stat">{stat(users)}</p></Card>
        <Card title="כיתות פעילות"><p className="stat">{stat(classes)}</p></Card>
        <Card title="תלמידים"><p className="stat">{stat(students)}</p></Card>
      </div>
      <p className="muted">נתוני שימוש והתפלגויות יתווספו כשייבנה שירות האנליטיקה.</p>
    </div>
  );
}
