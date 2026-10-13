import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../../api/announcements.js";
import AnnouncementCard from "../../components/domain/AnnouncementCard.jsx";
import AnnouncementForm from "../../components/domain/AnnouncementForm.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { useToast } from "../../components/ui/Toast.jsx";

export default function AdminAnnouncements() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => getAnnouncements(),
  });

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      addToast({ text: "ההודעה פורסמה בהצלחה", tone: "success" });
    },
    onError: (err) => {
      addToast({ text: err.response?.data?.message || "שגיאה בפרסום ההודעה", tone: "danger" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      addToast({ text: "ההודעה נמחקה בהצלחה", tone: "neutral" });
    },
    onError: (err) => {
      addToast({ text: err.response?.data?.message || "שגיאה במחיקת ההודעה", tone: "danger" });
    },
  });

  const items = data?.items || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", maxWidth: 840, marginInline: "auto" }}>
      <header>
        <h1 style={{ margin: 0, fontSize: "var(--fs-xl)", fontWeight: 700 }}>לוח מודעות בית ספרי</h1>
        <p style={{ margin: "var(--space-1) 0 0", color: "var(--color-text-muted)" }}>
          פרסום וניהול הודעות כלליות לכלל בית הספר, לצוות המורים ולהורים.
        </p>
      </header>

      <AnnouncementForm
        onSubmit={(payload, reset) => {
          createMutation.mutate(payload, { onSuccess: reset });
        }}
        isPending={createMutation.isPending}
      />

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <h2 style={{ margin: 0, fontSize: "var(--fs-lg)" }}>הודעות שפורסמו</h2>
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="אין הודעות עדיין" description="הודעות שיפורסמו יופיעו כאן עבור כל קהלי היעד." />
        ) : (
          items.map((a) => (
            <AnnouncementCard
              key={a._id || a.id}
              announcement={a}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </section>
    </div>
  );
}