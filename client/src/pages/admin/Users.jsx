import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminListUsers, adminRegister, adminUpdateUser } from "../../api/users.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import Input from "../../components/ui/Input.jsx";
import Select from "../../components/ui/Select.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { ROLE_LABEL } from "../../utils/constants.js";
import { fullName } from "../../utils/formatters.js";

function UserForm({ user, onDone }) {
  const isNew = !user.id;
  const [f, setF] = useState({
    userId: user.userId ?? "",
    email: user.email ?? "",
    password: "",
    role: user.role ?? "parent",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
  });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = useApiMutation(
    (body) => (isNew ? adminRegister(body) : adminUpdateUser(user.id, body)),
    { invalidate: [["adminUsers"]], success: isNew ? "המשתמש נוצר" : "המשתמש עודכן", onSuccess: onDone },
  );

  function onSubmit(e) {
    e.preventDefault();
    if (isNew) {
      save.mutate(f);
    } else {
      save.mutate({
        email: f.email,
        role: f.role,
        firstName: f.firstName,
        lastName: f.lastName,
      });
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      {isNew && <Input label="תעודת זהות" value={f.userId} onChange={set("userId")} required />}
      <Input label="אימייל" type="email" value={f.email} onChange={set("email")} required />
      {isNew && <Input label="סיסמה ראשונית" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" required minLength={8} />}
      <Input label="שם פרטי" value={f.firstName} onChange={set("firstName")} required />
      <Input label="שם משפחה" value={f.lastName} onChange={set("lastName")} required />
      <Select label="תפקיד" value={f.role} onChange={set("role")}>
        {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
      <Button type="submit" loading={save.isPending}>שמירה</Button>
    </form>
  );
}

export default function Users() {
  const [filters, setFilters] = useState({ role: "", fullName: "", isActive: "" });
  const [editing, setEditing] = useState(null); // {} = new user

  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["adminUsers", params],
    queryFn: () => adminListUsers(params),
  });

  const toggle = useApiMutation((u) => adminUpdateUser(u.id, { isActive: !u.isActive }), {
    invalidate: [["adminUsers"]],
    success: "הסטטוס עודכן",
  });

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="stack">
      <div className="page-header">
        <h1>משתמשים</h1>
        <Button onClick={() => setEditing({})}>משתמש חדש</Button>
      </div>

      <div className="toolbar">
        <Input label="חיפוש לפי שם" value={filters.fullName} onChange={setFilter("fullName")} />
        <Select label="תפקיד" value={filters.role} onChange={setFilter("role")}>
          <option value="">הכל</option>
          {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Select label="סטטוס" value={filters.isActive} onChange={setFilter("isActive")}>
          <option value="">הכל</option>
          <option value="true">פעיל</option>
          <option value="false">מושעה</option>
        </Select>
      </div>

      {isLoading && <Spinner />}
      {error && <EmptyState title="שגיאה בטעינת המשתמשים" />}
      {users && users.length === 0 && <EmptyState title="לא נמצאו משתמשים" />}
      {users && users.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>שם</th>
                <th>ת"ז</th>
                <th>אימייל</th>
                <th>תפקיד</th>
                <th>סטטוס</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="שם">{fullName(u)}</td>
                  <td data-label='ת"ז'>{u.userId}</td>
                  <td data-label="אימייל">{u.email}</td>
                  <td data-label="תפקיד">{ROLE_LABEL[u.role]}</td>
                  <td data-label="סטטוס"><Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "פעיל" : "מושעה"}</Badge></td>
                  <td>
                    <div className="row">
                      <Button variant="secondary" onClick={() => setEditing(u)}>עריכה</Button>
                      <Button variant={u.isActive ? "danger" : "secondary"} loading={toggle.isPending && toggle.variables?.id === u.id}
                        onClick={() => toggle.mutate(u)}>
                        {u.isActive ? "השעיה" : "הפעלה"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(editing)} title={editing?.id ? "עריכת משתמש" : "משתמש חדש"} onClose={() => setEditing(null)}>
        {editing && <UserForm user={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}
