import { Link } from "react-router-dom";
import { Users, GraduationCap, UserCheck, ShieldAlert } from "lucide-react";
import { useSchoolAnalytics } from "../../hooks/useAnalytics.js";
import Card from "../../components/ui/Card.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Button from "../../components/ui/Button.jsx";
import Badge from "../../components/ui/Badge.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import {
  ChartCard,
  SubjectBarChart,
  TrendLineChart,
  AttendanceChart,
  DistributionChart,
  RiskDonut,
} from "../../components/domain/charts/index.js";

export default function AdminDashboard() {
  const { data: analytics, isLoading, error } = useSchoolAnalytics({ months: 6 });

  if (isLoading) return <Spinner />;
  if (error) return <EmptyState title="שגיאה בטעינת נתוני האנליטיקה הבית-ספרית" />;

  const totals = analytics?.totals || {};
  const users = totals.users || {};
  const classesList = analytics?.classes || [];

  // Transform classes for comparison bar chart
  const classComparisonData = classesList.map((c) => ({
    subject: c.className,
    average: c.average ?? 0,
  }));

  const riskAlertTotal = (analytics?.riskDistribution?.alert || 0) + (analytics?.riskDistribution?.warning || 0);

  return (
    <div className="stack">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1>לוח בקרה ניהולי - בית ספרי</h1>
          <p className="muted">
            סקירה רוחבית: סטטוס משתמשים, ביצועי כיתות, מדדי סיכון ומעקב נוכחות.
          </p>
        </div>
        <div className="row">
          <Link to="/admin/classes">
            <Button variant="secondary">ניהול כיתות</Button>
          </Link>
          <Link to="/admin/users">
            <Button variant="secondary">ניהול משתמשים</Button>
          </Link>
        </div>
      </header>

      {/* Totals Cards */}
      <div className="grid grid-4">
        <StatCard
          title="סה״כ תלמידים"
          value={totals.students ?? 0}
          icon={Users}
          tone="primary"
        />

        <StatCard
          title="כיתות פעילות"
          value={totals.classes ?? 0}
          icon={GraduationCap}
          tone="primary"
        />

        <StatCard
          title="משתמשים במערכת"
          value={(users.admin || 0) + (users.teacher || 0) + (users.parent || 0)}
          icon={UserCheck}
          tone="neutral"
          subtext={`${users.active || 0} פעילים · ${users.suspended || 0} מושהים`}
        />

        <StatCard
          title="תלמידים במעקב סיכון"
          value={riskAlertTotal}
          icon={ShieldAlert}
          tone={riskAlertTotal > 0 ? "warning" : "success"}
          subtext={`${analytics?.riskDistribution?.alert || 0} בסיכון גבוה`}
        />
      </div>

      {/* Risk & Distribution Charts */}
      <div className="grid grid-2">
        <ChartCard
          title="התפלגות סיכון אקדמי בית ספרי"
          subtitle="חלוקת כלל תלמידי בית הספר לפי רמות סיכון"
          isEmpty={!analytics?.riskDistribution}
        >
          <RiskDonut
            distribution={analytics?.riskDistribution || { ok: 0, warning: 0, alert: 0 }}
            totalStudents={totals.students || 0}
          />
        </ChartCard>

        <ChartCard
          title="התפלגות ציונים בית ספרית"
          subtitle="פילוח ממוצעי כלל התלמידים לפי טווחים"
          isEmpty={!analytics?.gradeDistribution}
        >
          <DistributionChart distribution={analytics?.gradeDistribution || {}} />
        </ChartCard>
      </div>

      {/* Class Comparison Chart */}
      <ChartCard
        title="השוואת ממוצעי כיתות"
        subtitle="ממוצע ציונים כולל לפי כיתה"
        isEmpty={classComparisonData.length === 0}
      >
        <SubjectBarChart data={classComparisonData} />
      </ChartCard>

      {/* School Trends & Attendance */}
      <div className="grid grid-2">
        <ChartCard
          title="מגמת ממוצע בית ספרי"
          subtitle="מעקב ממוצע הציונים ב-6 החודשים האחרונים"
          isEmpty={!analytics?.gradesTrend || analytics.gradesTrend.length === 0}
        >
          <TrendLineChart data={analytics?.gradesTrend || []} />
        </ChartCard>

        <ChartCard
          title="מעקב היעדרויות ואיחורים כללי"
          subtitle="התפלגות אירועי נוכחות בית ספרית"
          isEmpty={!analytics?.attendanceByMonth || analytics.attendanceByMonth.length === 0}
        >
          <AttendanceChart data={analytics?.attendanceByMonth || []} />
        </ChartCard>
      </div>

      {/* Detailed Classes Breakdown Table */}
      <Card title="פירוט ביצועי כיתות">
        {classesList.length === 0 ? (
          <EmptyState title="אין כיתות במערכת" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>כיתה</th>
                  <th>מחנך/ת</th>
                  <th>תלמידים</th>
                  <th>ממוצע</th>
                  <th>חיסורים לתלמיד</th>
                  <th>סטטוס סיכון</th>
                </tr>
              </thead>
              <tbody>
                {classesList.map((cls) => {
                  const alertCount = cls.riskDistribution?.alert || 0;
                  const warnCount = cls.riskDistribution?.warning || 0;
                  return (
                    <tr key={cls.classId}>
                      <td data-label="כיתה">
                        <strong>{cls.className}</strong>
                      </td>
                      <td data-label="מחנך/ת">{cls.teacherName || "—"}</td>
                      <td data-label="תלמידים">{cls.studentsCount}</td>
                      <td data-label="ממוצע">
                        {cls.average !== null ? `${cls.average}` : "—"}
                      </td>
                      <td data-label="חיסורים לתלמיד">
                        {cls.absencesPerStudent !== null ? `${cls.absencesPerStudent}` : "—"}
                      </td>
                      <td data-label="סטטוס סיכון">
                        {alertCount > 0 ? (
                          <Badge tone="danger">{alertCount} בסיכון גבוה</Badge>
                        ) : warnCount > 0 ? (
                          <Badge tone="warning">{warnCount} באזהרה</Badge>
                        ) : (
                          <Badge tone="success">תקין</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
