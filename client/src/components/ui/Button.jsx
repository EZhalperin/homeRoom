import styles from "./Button.module.css";

/** variant: primary | secondary | danger | ghost */
export default function Button({
  variant = "primary", loading = false, disabled, className = "", children, type = "button", ...props
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? "..." : children}
    </button>
  );
}
