import { useState } from "react";
import { useMyClass } from "../../hooks/queries.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { teacherCreateForm, teacherUpdateForm } from "../../api/forms.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { formatDate, toDateInput, todayInput } from "../../utils/formatters.js";

/** Every student holds a copy of each form; group copies by title + deadline. */
function aggregate(students) {
  const map = new Map();
  for (const s of students) {
    for (const f of s.forms ?? []) {
      const key = `${f.title}|${new Date(f.deadline).getTime()}`;
      const entry = map.get(key) ?? { ...f, total: 0, approved: 0 };
      entry.total += 1;
      if (f.isApproved) entry.approved += 1;
      map.set(key, entry);
    }
  }
  return [...map.values()];
}

export default function Forms() {
  const { data, isLoading, error } = useMyClass();
  const [form, setForm] = useState({ title: "", description: "", deadline: todayInput() });
  const [editing, setEditing] = useState(null);
  const [edit, setEdit] = useState({ description: "", newDeadline: "" });

  const create = useApiMutation(teacherCreateForm, {
    invalidate: [["myClass"]], success: "הטופס הופץ לכל הכיתה",
    onSuccess: () => setForm({ title: "", description: "", deadline: todayInput() }),
  });
  const update = useApiMutation(teacherUpdateForm, {
    invalidate: [["myClass"]], success: "הטופס עודכן", onSuccess: () => setEditing(null),
  });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא משויכת אליך כיתה פעילה" />;

  const forms = aggregate(data.students);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function openEdit(f) {
    setEditing(f);
    setEdit({ description: f.description, newDeadline: toDateInput(f.deadline) });
  }

  function onUpdate(e) {
    e.preventDefault();
    const body = { title: editing.title, deadline: editing.deadline };
    if (edit.description !== editing.description) body.description = edit.description;
    if (edit.newDeadline !== toDateInput(editing.deadline)) body.newDeadline = edit.newDeadline;
    if (Object.keys(body).length === 2) return setEditing(null);
    update.mutate(body);
  }

  return (
    <div className="stack">
      <div className="page-header"><h1>טפסים</h1></div>

      <Card title="טופס חדש (יופץ לכל תלמידי הכיתה)">
        <form className="stack" onSubmit={(e) => { e.preventDefault(); create.mutate(form); }}>
          <Input label="כותרת" value={form.title} onChange={set("title")} required />
          <Input as="textarea" label="תוכן הטופס" value={form.description} onChange={set("description")} required />
          <Input label="יעד אחרון לאישור" type="date" value={form.deadline} onChange={set("deadline")} required />
          <Button type="submit" loading={create.isPending}>הפצה</Button>
        </form>
      </Card>

      <Card title="טפסים שהופצו">
        {forms.length === 0 ? <p className="muted">עדיין לא הופצו טפסים</p> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>כותרת</th><th>יעד אחרון</th><th>אישורים</th><th /></tr></thead>
              <tbody>
                {forms.map((f) => (
                  <tr key={`${f.title}-${f.deadline}`}>
                    <td data-label="כותרת">{f.title}</td>
                    <td data-label="יעד אחרון">{formatDate(f.deadline)}</td>
                    <td data-label="אישורים">{f.approved} / {f.total}</td>
                    <td><Button variant="secondary" onClick={() => openEdit(f)}>עריכה</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={Boolean(editing)} title="עריכת טופס" onClose={() => setEditing(null)}>
        {editing && (
          <form className="stack" onSubmit={onUpdate}>
            <p className="muted">{editing.title}</p>
            <Input as="textarea" label="תוכן" value={edit.description} onChange={(e) => setEdit((x) => ({ ...x, description: e.target.value }))} />
            <Input label="יעד אחרון" type="date" value={edit.newDeadline} onChange={(e) => setEdit((x) => ({ ...x, newDeadline: e.target.value }))} />
            <Button type="submit" loading={update.isPending}>שמירה</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
