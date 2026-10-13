import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import { formatDate } from "../../utils/formatters.js";
import styles from "./FormCard.module.css";

export default function FormCard({ form, onApprove, loading }) {
  const expired = new Date(form.deadline) < new Date();
  return (
    <Card interactive>
      <div className={styles.cardContent}>
        <div className={styles.header}>
          <h2 className={styles.title}>{form.title}</h2>
          {form.isApproved ? (
            <Badge tone="success">אושר</Badge>
          ) : expired ? (
            <Badge tone="danger">פג תוקף</Badge>
          ) : (
            <Badge tone="warning">ממתין לאישור</Badge>
          )}
        </div>
        <p className={styles.description}>{form.description}</p>
        <p className={styles.deadline}>יעד אחרון לאישור: {formatDate(form.deadline)}</p>
        {!form.isApproved && !expired && onApprove && (
          <div className={styles.actions}>
            <Button loading={loading} onClick={onApprove}>
              אישור הטופס
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
