import { useQuery } from "@tanstack/react-query";
import { getAnnouncements } from "../../api/announcements.js";
import AnnouncementCard from "../../components/domain/AnnouncementCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";

export default function ParentAnnouncements() {
  const { data, isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => getAnnouncements(),
  });

  const items = Array.isArray(data) ? data : data?.items || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", maxWidth: 840, marginInline: "auto" }}>
      <header>
        <h1 style={{ margin: 0, fontSize: "var(--fs-xl)", fontWeight: 700 }}>לוח מודעות והודעות</h1>
        <p style={{ margin: "var(--space-1) 0 0", color: "var(--color-text-muted)" }}>
          עדכונים והודעות מצוות בית הספר וממחנך/ת הכיתה.
        </p>
      </header>

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="אין הודעות עדיין" description="הודעות חדשות מצוות בית הספר יופיעו כאן." />
        ) : (
          items.map((a) => (
            <AnnouncementCard key={a._id || a.id} announcement={a} />
          ))
        )}
      </section>
    </div>
  );
}