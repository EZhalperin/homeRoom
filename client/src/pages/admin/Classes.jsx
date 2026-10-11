import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminCreateClass, adminDeleteClass, staffListClasses } from "../../api/classes.js";
import { adminListUsers } from "../../api/users.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { fullName } from "../../utils/formatters.js";

function CreateClassForm({ onDone }) {
  const [className, setClassName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const { data: teachers = [] } = useQuery({
    queryKey: ["adminUsers", { role: "teacher", isActive: "true" }],
    queryFn: () => adminListUsers({ role: "teacher", isActive: "true" }),
  });
  const create = useApiMutation(adminCreateClass, {
    invalidate: [["classes"]], success: "הכיתה נוצרה", onSuccess: onDone,
  });

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); create.mutate({ teacherId, className }); }}>
      <Input label="שם הכיתה (למשל י'2)" value={className} onChange={(e) => setClassName(e.target.value)} required />
      <Select label="מורה מחנך" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
        <option value="" disabled>בחר מורה</option>
        {teachers.map((t) => <option key={t.id} value={t.userId}>{fullName(t)} ({t.userId})</option>)}
      </Select>
      <Button type="submit" loading={create.isPending}>יצירה</Button>
    </form>
  );
}

export default function Classes() {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const params = { isActive: "true", ...(search ? { className: search } : {}) };
  const { data: classes, isLoading, error } = useQuery({
    queryKey: ["classes", params],
    queryFn: () => staffListClasses(params),
  });
  const remove = useApiMutation((id) => adminDeleteClass(id), {
    invalidate: [["classes"], ["adminStudents"]], success: "הכיתה נמחקה", onSuccess: () => setDeleting(null),
  });

  return (
    <div className="stack">
      <div className="page-header">
        <h1>כיתות</h1>
        <Button onClick={() => setCreating(true)}>כיתה חדשה</Button>
      </div>
      <div className="toolbar"><Input label="חיפוש כיתה" value={search} onChange={(e) => setSearch(e.target.value)} /></div>

      {isLoading && <Spinner />}
      {error && <EmptyState title="שגיאה בטעינת הכיתות" />}
      {classes && classes.length === 0 && <EmptyState title="אין כיתות פעילות" />}
      {classes && classes.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>כיתה</th><th>ת"ז מורה</th><th>תלמידים</th><th /></tr></thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c._id}>
                  <td data-label="כיתה">{c.className}</td>
                  <td data-label='ת"ז מורה'>{c.teacherId}</td>
                  <td data-label="תלמידים">{c.studentsCount}</td>
                  <td>
                    <div className="row">
                      <Link to={`/admin/classes/${c._id}`}><Button variant="secondary">תלמידים</Button></Link>
                      <Button variant="danger" onClick={() => setDeleting(c)}>מחיקה</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating} title="כיתה חדשה" onClose={() => setCreating(false)}>
        {creating && <CreateClassForm onDone={() => setCreating(false)} />}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)} title="מחיקת כיתה"
        message={`למחוק את הכיתה ${deleting?.className ?? ""}?`}
        loading={remove.isPending} confirmLabel="מחיקה"
        onConfirm={() => remove.mutate(deleting._id)} onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
