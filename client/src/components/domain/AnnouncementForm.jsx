import { useState } from "react";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Button from "../ui/Button.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import styles from "./AnnouncementForm.module.css";

export default function AnnouncementForm({ onSubmit, isPending, defaultClassId }) {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState(isAdmin ? "all" : "class");
  const [classId, setClassId] = useState(defaultClassId || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("נא להזין כותרת");
      return;
    }
    if (!body.trim()) {
      setError("נא להזין תוכן להודעה");
      return;
    }
    if (target === "class" && !classId) {
      setError("נא להזין מזהה כיתה");
      return;
    }

    setError("");
    const payload = {
      title: title.trim(),
      body: body.trim(),
      target,
    };
    if (target === "class") {
      payload.classId = classId;
    }

    onSubmit(payload, () => {
      setTitle("");
      setBody("");
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>פרסום הודעה חדשה</h3>

      {error && <p style={{ color: "var(--color-danger)", margin: 0 }}>{error}</p>}

      <div className={styles.row}>
        <Input
          label="כותרת ההודעה"
          placeholder="לדוגמה: תזכורת ליום הורים"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {isAdmin ? (
          <Select
            label="קהל יעד"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="all">לכל בית הספר</option>
            <option value="teachers">למורים בלבד</option>
            <option value="parents">להורים בלבד</option>
            <option value="class">לכיתה ספציפית</option>
          </Select>
        ) : (
          <Select
            label="קהל יעד"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="class">לכיתה שלי</option>
            <option value="all">לכל בית הספר</option>
          </Select>
        )}
      </div>

      {target === "class" && !defaultClassId && (
        <Input
          label="מזהה כיתה"
          placeholder="מספר או מזהה הכיתה"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          required
        />
      )}

      <Input
        as="textarea"
        label="תוכן ההודעה"
        rows={4}
        placeholder="פרטי ההודעה..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />

      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "מפרסם..." : "פרסום הודעה"}
        </Button>
      </div>
    </form>
  );
}