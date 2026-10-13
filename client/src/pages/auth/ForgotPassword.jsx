import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { getErrorMessage } from "../../utils/errors.js";
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      toast.error(getErrorMessage(err) || "שגיאה בבקשת איפוס סיסמה.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="שכחתי סיסמה">
      {submitted ? (
        <div className={styles.successWrap}>
          <p className={styles.successText}>
            אם קיים חשבון עם כתובת זו, נשלח אליך קישור לאיפוס סיסמה בדקות הקרובות.
          </p>
          <div className={styles.footer}>
            <Link to="/login" className={styles.primaryLink}>
              חזרה לדף ההתחברות
            </Link>
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={onSubmit}>
          <p className={styles.description}>
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
          <div className={styles.footer}>
            <Link to="/login" className={styles.backLink}>
              חזרה להתחברות
            </Link>
          </div>
        </form>
      )}
    </Card>
  );
}
