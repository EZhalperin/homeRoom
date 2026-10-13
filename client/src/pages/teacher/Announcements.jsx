import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../../api/announcements.js";
import { useMyClass } from "../../hooks/queries.js";
import AnnouncementCard from "../../components/domain/AnnouncementCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { useToast } from "../../components/ui/Toast.jsx";

export default function TeacherAnnouncements() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { data: myClass, isLoading: isLoadingClass } = useMyClass();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState("");

  const { data, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => getAnnouncements(),
  });

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      addToast({ text: "ההודעה פורסמה בהצלחה להורי הכיתה", tone: "success" });
      setTitle("");
      setBody("");
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

  const hasActiveClass = Boolean(myClass?.className);
  const items = Array.isArray(data) ? data : data?.items || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasActiveClass) {
      setFormError("אין באפשרותך לפרסם הודעה ללא כיתה פעילה");
      return;
    }
    if (!title.trim()) {
      setFormError("נא להזין כותרת");
      return;
    }
    if (!body.trim()) {
      setFormError("נא להזין תוכן להודעה");
      return;
    }
    setFormError("");

    createMutation.mutate({
      title: title.trim(),
      body: body.trim(),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", maxWidth: 840, marginInline: "auto" }}>
      <header>
        <h1 style={{ margin: 0, fontSize: "var(--fs-xl)", fontWeight: 700 }}>הודעות לכיתה</h1>
        <p style={{ margin: "var(--space-1) 0 0", color: "var(--color-text-muted)" }}>
          פרסום הודעות להורי הכיתה וצפייה בהודעות רלוונטיות מכלל בית הספר.
        </p>
      </header>

      {isLoadingClass ? (
        <Spinner />
      ) : !hasActiveClass ? (
        <EmptyState
          title="אין כיתה פעילה משויכת"
          description="לא נמצאה כיתה פעילה תחת חשבונך. לא ניתן לפרסם הודעות כיתתיות בשלב זה."
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--fs-lg)", fontWeight: 700 }}>פרסום הודעה חדשה</h2>
            <div
              style={{
                backgroundColor: "var(--color-primary-soft)",
                color: "var(--color-primary)",
                padding: "var(--space-1) var(--space-3)",
                borderRadius: "var(--radius-pill)",
                fontSize: "var(--fs-sm)",
                fontWeight: 600,
              }}
            >
              נשלח להורי כיתה {myClass.className}
            </div>
          </div>

          {formError && <p style={{ color: "var(--color-danger)", margin: 0 }}>{formError}</p>}

          <Input
            label="כותרת ההודעה"
            placeholder="לדוגמה: תזכורת לפעילות ביום שישי"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setFormError("");
            }}
            required
          />

          <Input
            as="textarea"
            label="תוכן ההודעה"
            rows={4}
            placeholder="פרטי ההודעה להורי הכיתה..."
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setFormError("");
            }}
            required
          />

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "מפרסם..." : "פרסום הודעה לכיתה"}
            </Button>
          </div>
        </form>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <h2 style={{ margin: 0, fontSize: "var(--fs-lg)" }}>הודעות</h2>
        {isLoadingAnnouncements ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="אין הודעות עדיין" description="הודעות שיפורסמו על ידך או על ידי הנהלת בית הספר יופיעו כאן." />
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