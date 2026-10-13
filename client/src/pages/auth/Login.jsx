import { useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { getErrorMessage } from "../../utils/errors.js";
import { ROLE_HOME } from "../../utils/constants.js";
import styles from "./Login.module.css";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(userId.trim(), password);
      const from = location.state?.from?.pathname;
      const target = from && from.startsWith(ROLE_HOME[u.role]) ? from : ROLE_HOME[u.role];
      navigate(target, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="התחברות">
      <form className={styles.form} onSubmit={onSubmit}>
        <Input
          label="תעודת זהות"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          autoComplete="username"
          inputMode="numeric"
          required
        />
        <Input
          label="סיסמה"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <Button type="submit" loading={loading}>כניסה</Button>
        <div className={styles.footer}>
          <Link to="/forgot-password" className={styles.forgotLink}>
            שכחת סיסמה?
          </Link>
        </div>
      </form>
    </Card>
  );
}
