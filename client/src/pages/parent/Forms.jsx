import { useMyChild } from "../../hooks/queries.js";
import { useApiMutation } from "../../hooks/useApiMutation.js";
import { parentApproveForm } from "../../api/forms.js";
import FormCard from "../../components/domain/FormCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

export default function Forms() {
  const { data: child, isLoading, error } = useMyChild();
  const approve = useApiMutation((title) => parentApproveForm(child.id, title), {
    invalidate: [["myChild"]],
    success: "הטופס אושר",
  });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="לא נמצאו נתוני תלמיד" />;

  return (
    <div className="stack">
      <div className="page-header"><h1>טפסים לאישור</h1></div>
      {child.forms.length === 0 && <EmptyState title="אין טפסים כרגע" />}
      <div className="grid grid-2">
        {child.forms.map((f) => (
          <FormCard
            key={`${f.title}-${f.deadline}`}
            form={f}
            loading={approve.isPending && approve.variables === f.title}
            onApprove={() => approve.mutate(f.title)}
          />
        ))}
      </div>
    </div>
  );
}
