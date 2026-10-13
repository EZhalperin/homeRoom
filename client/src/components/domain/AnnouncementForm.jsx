import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { staffListClasses } from "../../api/classes.js";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import Spinner from "../ui/Spinner.jsx";
import styles from "./AnnouncementForm.module.css";

function extractGrade(className) {
  if (!className || typeof className !== "string") return "";
  return className.split(/[''’]/)[0].trim();
}

export default function AnnouncementForm({ onSubmit, isPending }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState("all");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const { data: classesData = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ["staffClasses", { isActive: "true" }],
    queryFn: () => staffListClasses({ isActive: "true" }),
  });

  const classes = useMemo(() => {
    return Array.isArray(classesData) ? classesData : classesData?.items || [];
  }, [classesData]);

  // Derive distinct grade prefixes and class counts
  const gradesList = useMemo(() => {
    const map = new Map();
    for (const c of classes) {
      const g = extractGrade(c.className);
      if (g) {
        const item = map.get(g) || { grade: g, count: 0, studentsCount: 0 };
        item.count += 1;
        item.studentsCount += c.studentsCount || 0;
        map.set(g, item);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.grade.localeCompare(b.grade));
  }, [classes]);

  // Filter classes by search query
  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase().trim();
    return classes.filter(
      (c) =>
        (c.className && c.className.toLowerCase().includes(q)) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(q)),
    );
  }, [classes, searchQuery]);

  // Compute live summary numbers
  const summary = useMemo(() => {
    if (audienceType === "all") {
      const totalClasses = classes.length;
      const totalStudents = classes.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
      return {
        count: totalClasses,
        students: totalStudents,
        text: `יישלח לכלל בית הספר (${totalClasses} כיתות · כ-${totalStudents} הורים)`,
        valid: true,
      };
    }

    if (audienceType === "grades") {
      if (selectedGrades.length === 0) {
        return { count: 0, students: 0, text: "נא לבחור לפחות שכבה אחת", valid: false };
      }
      const targeted = classes.filter((c) => selectedGrades.includes(extractGrade(c.className)));
      const totalStudents = targeted.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
      return {
        count: targeted.length,
        students: totalStudents,
        text: `יישלח ל-${targeted.length} כיתות (${selectedGrades.join(", ")}) · כ-${totalStudents} הורים`,
        valid: true,
      };
    }

    if (audienceType === "classes") {
      if (selectedClassIds.length === 0) {
        return { count: 0, students: 0, text: "נא לבחור לפחות כיתה אחת", valid: false };
      }
      const targeted = classes.filter((c) => selectedClassIds.includes(c._id));
      const totalStudents = targeted.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
      return {
        count: targeted.length,
        students: totalStudents,
        text: `יישלח ל-${targeted.length} כיתות · כ-${totalStudents} הורים`,
        valid: true,
      };
    }

    return { count: 0, students: 0, text: "", valid: false };
  }, [audienceType, classes, selectedGrades, selectedClassIds]);

  const toggleGrade = (grade) => {
    setError("");
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade],
    );
  };

  const toggleClass = (classId) => {
    setError("");
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId],
    );
  };

  const selectAllFiltered = () => {
    const idsToAdd = filteredClasses.map((c) => c._id);
    setSelectedClassIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const clearAllFiltered = () => {
    const idsToRemove = new Set(filteredClasses.map((c) => c._id));
    setSelectedClassIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("נא להזין כותרת");
      return;
    }
    if (!body.trim()) {
      setError("נא להזין תוכן להודעה");
      return;
    }
    if (!summary.valid) {
      setError(summary.text || "נא להגדיר קהל יעד תקין");
      return;
    }
    setError("");

    let audience;
    if (audienceType === "all") {
      audience = { type: "all" };
    } else if (audienceType === "grades") {
      audience = { type: "grades", grades: selectedGrades };
    } else if (audienceType === "classes") {
      audience = { type: "classes", classIds: selectedClassIds };
    }

    const payload = {
      title: title.trim(),
      body: body.trim(),
      audience,
    };

    onSubmit(payload, () => {
      setTitle("");
      setBody("");
      setSelectedGrades([]);
      setSelectedClassIds([]);
      setSearchQuery("");
      setAudienceType("all");
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>פרסום הודעה חדשה</h2>

      {error && <p style={{ color: "var(--color-danger)", margin: 0 }}>{error}</p>}

      <Input
        label="כותרת ההודעה"
        placeholder="לדוגמה: יום הורים שנתי"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError("");
        }}
        required
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <label style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--color-text)" }}>
          קהל יעד
        </label>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segmentBtn} ${audienceType === "all" ? styles.activeSegment : ""}`}
            onClick={() => {
              setAudienceType("all");
              setError("");
            }}
          >
            לכל בית הספר
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${audienceType === "grades" ? styles.activeSegment : ""}`}
            onClick={() => {
              setAudienceType("grades");
              setError("");
            }}
          >
            לפי שכבות
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${audienceType === "classes" ? styles.activeSegment : ""}`}
            onClick={() => {
              setAudienceType("classes");
              setError("");
            }}
          >
            כיתות ספציפיות
          </button>
        </div>
      </div>

      {isLoadingClasses ? (
        <Spinner />
      ) : (
        <>
          {audienceType === "grades" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>
                בחרו את השכבות אליהן תישלח ההודעה:
              </span>
              <div className={styles.chipsContainer}>
                {gradesList.map((g) => {
                  const isSelected = selectedGrades.includes(g.grade);
                  return (
                    <button
                      key={g.grade}
                      type="button"
                      className={`${styles.chipBtn} ${isSelected ? styles.activeChip : ""}`}
                      onClick={() => toggleGrade(g.grade)}
                    >
                      <span>שכבה {g.grade}</span>
                      <span style={{ opacity: 0.75, fontSize: "var(--fs-xs)" }}>
                        ({g.count} כיתות)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {audienceType === "classes" && (
            <div className={styles.classesSection}>
              <div className={styles.classesControls}>
                <div className={styles.searchBox}>
                  <Input
                    placeholder="חיפוש לפי שם כיתה או מחנך/ת..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button type="button" size="sm" variant="secondary" onClick={selectAllFiltered}>
                    בחר הכל
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={clearAllFiltered}>
                    נקה בחירה
                  </Button>
                </div>
              </div>

              <div className={styles.classesList}>
                {filteredClasses.length === 0 ? (
                  <p style={{ margin: 0, padding: "var(--space-2)", color: "var(--color-text-muted)", fontSize: "var(--fs-sm)" }}>
                    לא נמצאו כיתות תואמות לחיפוש
                  </p>
                ) : (
                  filteredClasses.map((c) => {
                    const isSelected = selectedClassIds.includes(c._id);
                    return (
                      <label key={c._id} className={styles.classItem}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleClass(c._id)}
                        />
                        <span>
                          <strong>{c.className}</strong> · {c.teacherName || "ללא מחנך"} · {c.studentsCount || 0} תלמידים
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Live summary box before sending */}
      <div className={styles.summaryBox}>
        <span>📢 {summary.text}</span>
      </div>

      <Input
        as="textarea"
        label="תוכן ההודעה"
        rows={4}
        placeholder="פרטי ההודעה לקהל היעד..."
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setError("");
        }}
        required
      />

      <div className={styles.actions}>
        <Button type="submit" variant="primary" disabled={isPending || !summary.valid}>
          {isPending ? "מפרסם..." : "פרסום הודעה"}
        </Button>
      </div>
    </form>
  );
}