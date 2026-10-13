import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";

const CONFIRMATION_MESSAGE = "אם הכתובת קיימת במערכת, נשלח אליה קישור לאיפוס סיסמה.";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(email.trim());
    } catch {
      // Neutral handling: do not expose server errors or user existence
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <Card title="שכחת סיסמה?">
      {submitted ? (
        <div className="stack" style={{ textAlign: "center" }}>
          <p role="status" aria-live="polite" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
            {CONFIRMATION_MESSAGE}
          </p>
          <div style={{ marginTop: "1rem" }}>
            <Link to="/login" style={{ color: "var(--color-primary)" }}>
              חזרה לדף ההתחברות
            </Link>
          </div>
        </div>
      ) : (
        <form className="stack" onSubmit={onSubmit}>
          <p style={{ color: "var(--color-muted)", margin: 0, fontSize: "0.95rem" }}>
            הזן את כתובת האימייל המשויכת לחשבונך ונשלח אליך קישור לאיפוס הסיסמה.
          </p>
          <Input
            label="כתובת אימייל"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={loading}
          />
          <Button type="submit" loading={loading} disabled={loading}>
            שליחת קישור לאיפוס
          </Button>
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <Link to="/login" style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
              חזרה להתחברות
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
}