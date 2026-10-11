import { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

export default function Modal({ open, title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {open && (
        <div className={styles.body}>
          <header className={styles.header}>
            <h2>{title}</h2>
            <button className={styles.close} aria-label="סגירה" onClick={onClose}>×</button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
