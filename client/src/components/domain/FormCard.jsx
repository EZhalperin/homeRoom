import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import { formatDate } from "../../utils/formatters.js";

export default function FormCard({ form, onApprove, loading }) {
  const expired = new Date(form.deadline) < new Date();
  return (
    <Card>
      <div className="stack">
        <div className="page-header" style={{ marginBlockEnd: 0 }}>
          <h2>{form.title}</h2>
          {form.isApproved ? <Badge tone="success">אושר</Badge>
            : expired ? <Badge tone="danger">פג תוקף</Badge>
            : <Badge tone="warning">ממתין לאישור</Badge>}
        </div>
        <p>{form.description}</p>
        <p className="muted">יעד אחרון לאישור: {formatDate(form.deadline)}</p>
        {!form.isApproved && !expired && (
          <Button loading={loading} onClick={onApprove}>אישור הטופס</Button>
        )}
      </div>
    </Card>
  );
}
