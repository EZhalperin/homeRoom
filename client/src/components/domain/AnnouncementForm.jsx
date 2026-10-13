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
  const [audienceType, setAudienceType] = useState(isAdmin ? "all" : "classes");
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
    if (isAdmin && audienceType === "classes" && !classId.trim()) {
      setError("נא להזין מזהה כיתה (24 תווים בפורמט Hex)");
      return;
    }

    setError("");

    const payload = {
      title: title.trim(),
      body: body.trim(),
    };

    if (isAdmin) {
      if (audienceType === "all") {
        payload.audience = { type: "all" };
      } else if (audienceType === "classes") {
        payload.audience = { type: "classes", classIds: [classId.trim()] };
      }
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
          onChange={(e) => {
            setTitle(e.target.value);
            setError("");
          }}
          required
        />

        {isAdmin ? (
          <Select
            label="קהל יעד"
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value)}
          >
            <option value="all">לכל בית הספר</option>
            <option value="classes">לכיתה ספציפית</option>
          </Select>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--color-text-muted)" }}>
              קהל יעד: הורי הכיתה שלי
            </span>
          </div>
        )}
      </div>

      {isAdmin && audienceType === "classes" && (
        <Input
          label="מזהה כיתה (Class ID)"
          placeholder="לדוגמה: 650000000000000000000001"
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
        onChange={(e) => {
          setBody(e.target.value);
          setError("");
        }}
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