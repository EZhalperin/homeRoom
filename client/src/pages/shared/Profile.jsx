import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { updateMe } from "../../api/users.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, password: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = useApiMutation(updateMe, {
    success: "הפרופיל עודכן",
    onSuccess: (data) => {
      updateUser({ firstName: data.firstName, lastName: data.lastName });
      setForm((f) => ({ ...f, password: "" }));
    },
  });

  function onSubmit(e) {
    e.preventDefault();
    const body = {};
    if (form.firstName !== user.firstName) body.firstName = form.firstName;
    if (form.lastName !== user.lastName) body.lastName = form.lastName;
    if (form.password) body.password = form.password;
    if (Object.keys(body).length > 0) save.mutate(body);
  }

  return (
    <div className="stack">
      <div className="page-header"><h1>פרופיל</h1></div>
      <Card>
        <form className="stack" onSubmit={onSubmit}>
          <p className="muted">ת"ז: {user.userId}</p>
          <Input label="שם פרטי" value={form.firstName} onChange={set("firstName")} />
          <Input label="שם משפחה" value={form.lastName} onChange={set("lastName")} />
          <Input label="סיסמה חדשה (השאר ריק ללא שינוי)" type="password" value={form.password}
            onChange={set("password")} autoComplete="new-password" />
          <Button type="submit" loading={save.isPending}>שמירה</Button>
        </form>
      </Card>
    </div>
  );
}
