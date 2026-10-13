import { Award, Activity, CalendarX, Clock } from "lucide-react";
import { useMyChild } from "../../hooks/queries.js";
import { useMyChildAnalytics } from "../../hooks/useAnalytics.js";
import Card from "../../components/ui/Card.jsx";
import Badge from "../../components/ui/Badge.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import GradesTable from "../../components/domain/GradesTable.jsx";
import AttendanceList from "../../components/domain/AttendanceList.jsx";
import {
  ChartCard,
  SubjectBarChart,
  TrendLineChart,
  AttendanceChart,
} from "../../components/domain/charts/index.js";
import { fullName } from "../../utils/formatters.js";

const RISK_BADGES = {
  alert: { label: "סיכון גבוה", tone: "danger" },
  warning: { label: "אזהרה", tone: "warning" },
  ok: { label: "תקין", tone: "success" },
};

export default function ChildOverview() {
  const { data: child, isLoading: isChildLoading, error: childError } = useMyChild();
  const { data: analytics, isLoading: isAnalyticsLoading } = useMyChildAnalytics({ months: 6 });

  if (isChildLoading) return <Spinner />;
  if (childError || !child) {
    return <EmptyState title="לא נמצאו נתוני תלמיד">לא משויך תלמיד לחשבון זה.</EmptyState>;
  }

  const teacherName = child.teacher
    ? `${child.teacher.firstName || ""} ${child.teacher.lastName || ""}`.trim()
    : "לא משויך";
  const classInfo = child.className
    ? `כיתה ${child.className} · המחנך/ת: ${teacherName}`
    : "";

  const riskBadgeConfig = RISK_BADGES[analytics?.riskLevel || "ok"] || RISK_BADGES.ok;
  const overallAvg = analytics?.overallAverage ?? null;
  const totals = analytics?.totals || {
    grades: child.grades?.length || 0,
    absences: (child.attendance || []).filter((a) => a.type === "absence").length,
    lates: (child.attendance || []).filter((a) => a.type === "late").length,
  };

  return (
    <div className="stack">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1>{fullName(child)}</h1>
          {classInfo && (
            <p className="muted" style={{ wordBreak: "break-word" }}>
              {classInfo}
            </p>
          )}
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-4">
        <StatCard
          title="ממוצע כולל"
          value={overallAvg}
          icon={Award}
          tone="primary"
        />

        <StatCard
          title="מצב לימודי"
          badge={<Badge tone={riskBadgeConfig.tone}>{riskBadgeConfig.label}</Badge>}
          icon={Activity}
          tone={riskBadgeConfig.tone}
        />

        <StatCard
          title="חיסורים"
          value={totals.absences}
          icon={CalendarX}
          tone={totals.absences > 5 ? "danger" : "neutral"}
          subtext="בחלון 60 הימים האחרונים"
        />

        <StatCard
          title="איחורים"
          value={totals.lates}
          icon={Clock}
          tone={totals.lates > 5 ? "warning" : "neutral"}
          subtext="בחלון 60 הימים האחרונים"
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-2">
        <ChartCard
          title="ממוצעי ציונים לפי מקצוע"
          subtitle="השוואה בין ציון התלמיד לממוצע הכיתתי (כאשר קיים)"
          isLoading={isAnalyticsLoading}
          isEmpty={!analytics?.subjectAverages || analytics.subjectAverages.length === 0}
        >
          <SubjectBarChart data={analytics?.subjectAverages || []} />
        </ChartCard>

        <ChartCard
          title="מגמת ממוצע ציונים"
          subtitle="מעקב חודשי אחר ממוצע הציונים ב-6 החודשים האחרונים"
          isLoading={isAnalyticsLoading}
          isEmpty={!analytics?.gradesTrend || analytics.gradesTrend.length === 0}
        >
          <TrendLineChart data={analytics?.gradesTrend || []} />
        </ChartCard>
      </div>

      <ChartCard
        title="מעקב נוכחות ואיחורים"
        subtitle="התפלגות אירועי היעדרות ואיחורים לפי חודשים"
        isLoading={isAnalyticsLoading}
        isEmpty={!analytics?.attendanceByMonth || analytics.attendanceByMonth.length === 0}
      >
        <AttendanceChart data={analytics?.attendanceByMonth || []} />
      </ChartCard>

      {/* Raw tables below */}
      <Card title="פירוט ציונים">
        <GradesTable grades={child.grades || []} />
      </Card>

      <Card title="יומן נוכחות">
        <AttendanceList records={child.attendance || []} />
      </Card>
    </div>
  );
}
