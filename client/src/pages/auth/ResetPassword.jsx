import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { validatePasswordToken, resetPassword } from "../../api/auth.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { getErrorMessage } from "../../utils/errors.js";
import styles from "./ResetPassword.module.css";

function getPasswordStrength(p) {
  if (!p) return { label: "", score: 0 };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Za-z]/.test(p) && /[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;

  if (score <= 1) return { label: "חלשה", color: "var(--color-danger)" };
  if (score === 2) return { label: "בינונית", color: "var(--color-warning)" };
  return { label: "חזקה", color: "var(--color-success)" };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [token] = useState(() => searchParams.get("token") || "");

  const [validating, setValidating] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [purpose, setPurpose] = useState("reset");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
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
        <div className={styles.centerState}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rectangular" height={40} width="100%" />
        </div>
      </Card>
    );
  }

  if (tokenError) {
    return (
      <Card title={pageTitle}>
        <div className={styles.centerState}>
          <p role="alert" aria-live="assertive" className={styles.errorText}>
            {tokenError}
          </p>
          <div className={styles.linksRow}>
            <Link to="/forgot-password" className={styles.primaryLink}>
              לבקשת קישור חדש
            </Link>
            <span className={styles.separator}>•</span>
            <Link to="/login" className={styles.mutedLink}>
              חזרה להתחברות
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title={pageTitle}>
      <form className={styles.form} onSubmit={onSubmit}>
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
          <div className={styles.strengthIndicator}>
            <span>חוזק סיסמה:</span>
            <strong className={styles.strengthLabel} style={{ color: strength.color }}>{strength.label}</strong>
          </div>
        )}

        <div className={styles.rulesBox}>
          <p className={styles.rulesTitle}>כללי סיסמה:</p>
          <ul className={styles.rulesList}>
            <li className={hasMinLength ? styles.ruleValid : styles.rulePending}>
              בין 8 ל-72 תווים
            </li>
            <li className={hasLetter ? styles.ruleValid : styles.rulePending}>
              לפחות אות אחת באנגלית
            </li>
            <li className={hasDigit ? styles.ruleValid : styles.rulePending}>
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
          <p role="alert" aria-live="polite" className={styles.errorText}>
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
