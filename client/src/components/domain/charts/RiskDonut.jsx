import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { getChartTheme } from "./chartTheme.js";
import styles from "./ChartCard.module.css";

export default function RiskDonut({ data = { ok: 0, warning: 0, alert: 0 }, height = 240 }) {
  const theme = getChartTheme();

  const total = (data.ok || 0) + (data.warning || 0) + (data.alert || 0);

  const chartData = [
    { name: "תקין", value: data.ok || 0, color: theme.success },
    { name: "אזהרה", value: data.warning || 0, color: theme.warning },
    { name: "סיכון גבוה", value: data.alert || 0, color: theme.danger },
  ];

  return (
    <div style={{ width: "100%", height, position: "relative", direction: "ltr" }} aria-label="תרשים עוגה התפלגות מדד סיכון">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderRadius: "8px",
              color: theme.text,
              direction: "rtl",
              textAlign: "right",
            }}
            formatter={(value, name) => [`${value} תלמידים`, name]}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ direction: "rtl", paddingTop: "5px", fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div
        style={{
          position: "absolute",
          top: "44%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <span style={{ fontSize: "var(--fs-xl)", fontWeight: 700, color: "var(--color-text)" }}>
          {total}
        </span>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" }}>
          תלמידים
        </div>
      </div>

      {/* Visually hidden accessible data table */}
      <table className={styles.visuallyHidden}>
        <caption>התפלגות תלמידים לפי רמות סיכון אקדמי</caption>
        <thead>
          <tr>
            <th>רמת סיכון</th>
            <th>כמות תלמידים</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((d) => (
            <tr key={d.name}>
              <td>{d.name}</td>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}