import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Award, AlertTriangle } from "lucide-react";
import { useMyClassAnalytics } from "../../hooks/useAnalytics.js";
import { useMyClass } from "../../hooks/queries.js";
import Card from "../../components/ui/Card.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import Button from "../../components/ui/Button.jsx";
import Spinner from "../../components/ui/Spinner.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import RiskBadge from "../../components/domain/RiskBadge.jsx";
import RiskExplanationModal from "../../components/domain/RiskExplanationModal.jsx";
import {
  ChartCard,
  SubjectBarChart,
  TrendLineChart,
  AttendanceChart,
  DistributionChart,
  RiskDonut,
} from "../../components/domain/charts/index.js";

export default function TeacherDashboard() {
  const { data: myClass, isLoading: isClassLoading, error: classError } = useMyClass();
  const { data: analytics, isLoading: isAnalyticsLoading } = useMyClassAnalytics({ months: 6 });
  const [selectedStudentForRisk, setSelectedStudentForRisk] = useState(null);

  if (isClassLoading) return <Spinner />;
  if (classError || !myClass) {
    return <EmptyState title="לא משויכת אליך כיתה פעילה">יש לפנות להנהלה לשיוך כיתה.</EmptyState>;
  }

  const atRiskStudents = analytics?.atRisk || [];
  const studentsCount = analytics?.studentsCount ?? myClass.students?.length ?? 0;
  const classAvg = analytics?.classAverage ?? null;

  return (
    <div className="stack">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1>לוח בקרה פדגוגי - כיתה {myClass.className}</h1>
          <p className="muted">
            תמונת מצב כיתתית: הישגים, התפלגויות סיכון ומעקב נוכחות.
          </p>
        </div>
        <Link to="/teacher/class">
          <Button variant="secondary">לרשימת התלמידים המלאה</Button>
        </Link>
      </header>

      {/* Top metrics */}
      <div className="grid grid-3">
        <StatCard
          title="תלמידים בכיתה"
          value={studentsCount}
          icon={Users}
          tone="primary"
        />

        <StatCard
          title="ממוצע כיתתי כולל"
          value={classAvg}
          icon={Award}
          tone="primary"
        />

        <StatCard
          title="תלמידים בסיכון (אזהרה/התראה)"
          value={atRiskStudents.length}
          icon={AlertTriangle}
          tone={atRiskStudents.length > 0 ? "warning" : "success"}
          subtext="מדד סיכון אקדמי >= 6.0"
        />
      </div>

      {/* Overview Charts Grid */}
      <div className="grid grid-2">
        <ChartCard
          title="התפלגות סיכון אקדמי"
          subtitle="פילוח רמות הסיכון בכיתה (תקין / אזהרה / התראה)"
          isLoading={isAnalyticsLoading}
          isEmpty={!analytics?.riskDistribution}
        >
          <RiskDonut
            distribution={analytics?.riskDistribution || { ok: 0, warning: 0, alert: 0 }}
            totalStudents={studentsCount}
          />
        </ChartCard>

        <ChartCard
          title="התפלגות ציונים כוללת"
          subtitle="כמות התלמידים לפי טווחי ציונים"
          isLoading={isAnalyticsLoading}
          isEmpty={!analytics?.gradeDistribution}
        >
          <DistributionChart distribution={analytics?.gradeDistribution || {}} />
        </ChartCard>
      </div>

      {/* Subject Averages & Trend */}
      <div className="grid grid-2">
        <ChartCard
          title="ממוצעי ציונים לפי מקצוע"
          subtitle="השוואת ממוצעי המקצועות בכיתה"
          isLoading={isAnalyticsLoading}
          isEmpty={!analytics?.subjectAverages || analytics.subjectAverages.length === 0}
        >
          <SubjectBarChart data={analytics?.subjectAverages || []} />
        </ChartCard>

        <ChartCard
          title="מגמת ממוצע ציונים"
          subtitle="מעקב חודשי אחר ממוצע הציונים בכיתה ב-6 החודשים האחרונים"
          isLoading={isAnalyticsLoading}
          isEmpty={!analytics?.gradesTrend || analytics.gradesTrend.length === 0}
        >
          <TrendLineChart data={analytics?.gradesTrend || []} />
        </ChartCard>
      </div>

      {/* Attendance Chart */}
      <ChartCard
        title="מעקב היעדרויות ואיחורים כיתתי"
        subtitle="סה״כ חיסורים ואיחורים בכיתה לפי חודש"
        isLoading={isAnalyticsLoading}
        isEmpty={!analytics?.attendanceByMonth || analytics.attendanceByMonth.length === 0}
      >
        <AttendanceChart data={analytics?.attendanceByMonth || []} />
      </ChartCard>

      {/* At-Risk Focus Table */}
      <Card title="תלמידים הדורשים תשומת לב פדגוגית">
        {atRiskStudents.length === 0 ? (
          <EmptyState title="אין תלמידים בסיכון בכיתה">
            כל התלמידים נמצאים ברמת סיכון תקינה.
          </EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>שם התלמיד</th>
                  <th>מדד סיכון</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {atRiskStudents.map((st) => (
                  <tr key={st.id}>
                    <td data-label="שם התלמיד">{st.name}</td>
                    <td data-label="מדד סיכון">
                      <RiskBadge
                        riskIndex={st.riskIndex}
                        onClick={() => setSelectedStudentForRisk(st)}
                      />
                    </td>
                    <td data-label="פעולות">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedStudentForRisk(st)}
                      >
                        הסבר מדד
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Explanation Modal */}
      {selectedStudentForRisk && (
        <RiskExplanationModal
          open={!!selectedStudentForRisk}
          onClose={() => setSelectedStudentForRisk(null)}
          studentId={selectedStudentForRisk.id}
          studentName={selectedStudentForRisk.name}
        />
      )}
    </div>
  );
}
