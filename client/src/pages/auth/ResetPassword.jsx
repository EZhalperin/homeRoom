import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { validatePasswordToken, resetPassword } from "../../api/auth.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { getErrorMessage } from "../../utils/errors.js";

function getPasswordStrength(p) {
  if (!p) return { label: "", score: 0 };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Za-z]/.test(p) && /[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  if (score <= 1) return { label: "חלשה", color: "var(--color-danger, #ef4444)" };
  if (score === 2) return { label: "בינונית", color: "var(--color-warning, #f59e0b)" };
  return { label: "חזקה", color: "var(--color-success, #10b981)" };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Read token on initial render into state, then immediately clean query string
  const [token] = useState(() => searchParams.get("token") || "");

  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [purpose, setPurpose] = useState("reset"); // "invite" | "reset"

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    // Strip token from URL bar immediately to prevent history/referrer leakage
    if (searchParams.has("token")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!token) {
      setValidating(false);
      setTokenError("לא סופק קישור תקין או שהטוקן חסר.");
      return;
    }

    validatePasswordToken(token)
      .then((res) => {
        setPurpose(res.purpose || "reset");
        setValidating(false);
      })
      .catch((err) => {
        setTokenError(getErrorMessage(err) || "הקישור אינו תקף או שפג תוקפו.");
        setValidating(false);
      });
  }, [token, searchParams]);

  const hasMinLength = password.length >= 8 && password.length <= 72;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isFormValid = hasMinLength && hasLetter && hasDigit && passwordsMatch;
  const strength = getPasswordStrength(password);

  async function onSubmit(e) {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitError("");
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      toast.success(
        purpose === "invite" ? "הסיסמה הוגדרה בהצלחה! ניתן להתחבר." : "הסיסמה אופסה בהצלחה! ניתן להתחבר.",
      );
      navigate("/login", { replace: true });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const pageTitle = purpose === "invite" ? "הגדרת סיסמה ראשונית" : "איפוס סיסמה";

  if (validating) {
    return (
      <Card title="בדיקת תקינות הקישור...">
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
          <Spinner />
        </div>
      </Card>
    );
  }

  if (tokenError) {
    return (
      <Card title={pageTitle}>
        <div className="stack" style={{ textAlign: "center" }}>
          <p role="alert" aria-live="assertive" style={{ color: "var(--color-danger, #ef4444)" }}>
            {tokenError}
          </p>
          <div className="row" style={{ justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
            <Link to="/forgot-password" style={{ color: "var(--color-primary)" }}>
              לבקשת קישור חדש
            </Link>
            <span style={{ color: "var(--color-muted)" }}>•</span>
            <Link to="/login" style={{ color: "var(--color-muted)" }}>
              חזרה להתחברות
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title={pageTitle}>
      <form className="stack" onSubmit={onSubmit}>
        <Input
          label="סיסמה חדשה"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          disabled={submitting}
        />

        {password && (
          <div style={{ fontSize: "0.85rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ color: "var(--color-muted)" }}>חוזק סיסמה:</span>
            <strong style={{ color: strength.color }}>{strength.label}</strong>
          </div>
        )}

        <div
          style={{
            fontSize: "0.82rem",
            color: "var(--color-muted)",
            backgroundColor: "var(--color-bg-subtle, #f8fafc)",
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid var(--color-border, #e2e8f0)",
          }}
        >
          <p style={{ margin: "0 0 0.25rem 0", fontWeight: 600 }}>כללי סיסמה:</p>
          <ul style={{ margin: 0, paddingInlineStart: "1.2rem" }}>
            <li style={{ color: hasMinLength ? "var(--color-success, #10b981)" : "inherit" }}>
              בין 8 ל-72 תווים
            </li>
            <li style={{ color: hasLetter ? "var(--color-success, #10b981)" : "inherit" }}>
              לפחות אות אחת באנגלית
            </li>
            <li style={{ color: hasDigit ? "var(--color-success, #10b981)" : "inherit" }}>
              לפחות ספרה אחת
            </li>
          </ul>
        </div>

        <Input
          label="אימות סיסמה"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          disabled={submitting}
          error={confirmPassword && !passwordsMatch ? "הסיסמאות אינן תואמות" : undefined}
        />

        {submitError && (
          <p role="alert" aria-live="polite" style={{ color: "var(--color-danger, #ef4444)" }}>
            {submitError}
          </p>
        )}

        <Button type="submit" loading={submitting} disabled={!isFormValid || submitting}>
          {purpose === "invite" ? "הגדר סיסמה והתחבר" : "שמור סיסמה חדשה"}
        </Button>
      </form>
    </Card>
  );
}