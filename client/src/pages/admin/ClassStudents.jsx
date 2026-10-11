import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminAddStudent, adminDeleteStudent, adminListStudents } from "../../api/students.js";
import { staffListClasses } from "../../api/classes.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/domain/RiskBadge.jsx";
import { fullName } from "../../utils/formatters.js";

export default function ClassStudents() {
  const { classId } = useParams();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [f, setF] = useState({ studentId: "", firstName: "", lastName: "" });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const { data: all, isLoading } = useQuery({ queryKey: ["adminStudents"], queryFn: adminListStudents });
  const { data: classes } = useQuery({
    queryKey: ["classes", { isActive: "true" }],
    queryFn: () => staffListClasses({ isActive: "true" }),
  });

  const className = classes?.find((c) => c._id === classId)?.className ?? "";
  const students = (all ?? []).filter((s) => s.classId === classId);

  const add = useApiMutation((body) => adminAddStudent(classId, body), {
    invalidate: [["adminStudents"], ["classes"]], success: "התלמיד נוסף",
    onSuccess: () => { setAdding(false); setF({ studentId: "", firstName: "", lastName: "" }); },
  });
  const remove = useApiMutation((id) => adminDeleteStudent(classId, id), {
    invalidate: [["adminStudents"], ["classes"]], success: "התלמיד הוסר", onSuccess: () => setRemoving(null),
  });

  return (
    <div className="stack">
      <div className="page-header">
        <h1>כיתה {className}</h1>
        <div className="row">
          <Link to="/admin/classes"><Button variant="secondary">חזרה</Button></Link>
          <Button onClick={() => setAdding(true)}>הוספת תלמיד</Button>
        </div>
      </div>

      {isLoading && <Spinner />}
      {!isLoading && students.length === 0 && <EmptyState title="אין תלמידים בכיתה" />}
      {students.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>תלמיד</th><th>ת"ז</th><th>מדד סיכון</th><th /></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td data-label="תלמיד">{fullName(s)}</td>
                  <td data-label='ת"ז'>{s.studentId}</td>
                  <td data-label="מדד סיכון"><RiskBadge value={s.academicRiskIndex} /></td>
                  <td><Button variant="danger" onClick={() => setRemoving(s)}>הסרה</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={adding} title="הוספת תלמיד" onClose={() => setAdding(false)}>
        {adding && (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); add.mutate(f); }}>
            <Input label="תעודת זהות" value={f.studentId} onChange={set("studentId")} required />
            <Input label="שם פרטי" value={f.firstName} onChange={set("firstName")} required />
            <Input label="שם משפחה" value={f.lastName} onChange={set("lastName")} required />
            <Button type="submit" loading={add.isPending}>הוספה</Button>
          </form>
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(removing)} title="הסרת תלמיד"
        message={`להסיר את ${removing ? fullName(removing) : ""}? כל הציונים והנוכחות שלו יימחקו.`}
        confirmLabel="הסרה" loading={remove.isPending}
        onConfirm={() => remove.mutate(removing.id)} onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
