import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { getChartTheme } from "./chartTheme.js";
import styles from "./ChartCard.module.css";

export default function AttendanceChart({ data = [], height = 240 }) {
  const theme = getChartTheme();

  return (
    <div style={{ width: "100%", height, direction: "ltr" }} aria-label="תרשים עמודות מעקב נוכחות ואיחורים חודשי">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
          <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 12 }} />
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
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ direction: "rtl", paddingBottom: "10px", fontSize: "12px" }}
          />
          <Bar
            dataKey="absences"
            name="חיסורים"
            stackId="att"
            fill={theme.danger}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="lates"
            name="איחורים"
            stackId="att"
            fill={theme.warning}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Visually hidden accessible data table */}
      <table className={styles.visuallyHidden}>
        <caption>מעקב נוכחות ואיחורים לפי חודש</caption>
        <thead>
          <tr>
            <th>חודש</th>
            <th>חיסורים</th>
            <th>איחורים</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{d.absences}</td>
              <td>{d.lates}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}