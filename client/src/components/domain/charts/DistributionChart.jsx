import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getChartTheme } from "./chartTheme.js";
import styles from "./ChartCard.module.css";

export default function DistributionChart({ data = [], height = 240 }) {
  const theme = getChartTheme();

  return (
    <div style={{ width: "100%", height, direction: "ltr" }} aria-label="תרשים עמודות התפלגות ציוני תלמידים">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
          <XAxis dataKey="bucket" tick={{ fill: theme.textMuted, fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: theme.textMuted, fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderRadius: "8px",
              color: theme.text,
              direction: "rtl",
              textAlign: "right",
            }}
            formatter={(val) => [`${val} תלמידים`, "כמות"]}
          />
          <Bar
            dataKey="count"
            name="כמות תלמידים"
            fill={theme.primary}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Visually hidden accessible data table */}
      <table className={styles.visuallyHidden}>
        <caption>התפלגות ממוצעי ציונים</caption>
        <thead>
          <tr>
            <th>טווח ציון</th>
            <th>כמות תלמידים</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.bucket}>
              <td>{d.bucket}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}