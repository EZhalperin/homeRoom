import { useState } from "react";
import { useMyClass } from "../../hooks/queries.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { addGrade, updateGrade } from "../../api/grades.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import StudentSelect from "../../components/domain/StudentSelect.jsx";
import GradesTable from "../../components/domain/GradesTable.jsx";
import { todayInput } from "../../utils/formatters.js";

const EMPTY = { subject: "", taskName: "", score: "", weight: "0.2", date: todayInput() };

export default function Grades() {
  const { data, isLoading, error } = useMyClass();
  const [studentId, setStudentId] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [score, setScore] = useState("");

  const students = data?.students ?? [];
  const student = students.find((s) => s.id === studentId) ?? students[0];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const add = useApiMutation((body) => addGrade(student.id, body), {
    invalidate: [["myClass"]], success: "הציון נוסף",
    onSuccess: () => setForm((f) => ({ ...f, taskName: "", score: "" })),
  });
  const update = useApiMutation((body) => updateGrade(student.id, body), {
    invalidate: [["myClass"]], success: "הציון עודכן", onSuccess: () => setEditing(null),
  });

  if (isLoading) return <Spinner />;
  if (error || students.length === 0) return <EmptyState title="אין תלמידים בכיתה" />;

  function onAdd(e) {
    e.preventDefault();
    add.mutate({ ...form, score: Number(form.score), weight: Number(form.weight) });
  }

  return (
    <div className="stack">
      <div className="page-header"><h1>ציונים</h1></div>
      <StudentSelect students={students} value={student.id} onChange={setStudentId} />

      <Card title="הוספת ציון">
        <form className="stack" onSubmit={onAdd}>
          <div className="grid grid-2">
            <Input label="מקצוע" value={form.subject} onChange={set("subject")} required />
            <Input label="שם המטלה" value={form.taskName} onChange={set("taskName")} required />
            <Input label="ציון (0-100)" type="number" min="0" max="100" value={form.score} onChange={set("score")} required />
            <Input label="משקל (0-1)" type="number" min="0" max="1" step="0.05" value={form.weight} onChange={set("weight")} required />
            <Input label="תאריך" type="date" value={form.date} onChange={set("date")} required />
          </div>
          <Button type="submit" loading={add.isPending}>הוספה</Button>
        </form>
      </Card>

      <Card title="ציוני התלמיד">
        <GradesTable
          grades={student.grades}
          renderActions={(g) => (
            <Button variant="secondary" onClick={() => { setEditing(g); setScore(String(g.score)); }}>עדכון</Button>
          )}
        />
      </Card>

      <Modal open={Boolean(editing)} title="עדכון ציון" onClose={() => setEditing(null)}>
        {editing && (
          <form className="stack" onSubmit={(e) => {
            e.preventDefault();
            update.mutate({ subject: editing.subject, date: editing.date, taskName: editing.taskName, score: Number(score) });
          }}>
            <p className="muted">{editing.subject} · {editing.taskName}</p>
            <Input label="ציון חדש" type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} required />
            <Button type="submit" loading={update.isPending}>שמירה</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
