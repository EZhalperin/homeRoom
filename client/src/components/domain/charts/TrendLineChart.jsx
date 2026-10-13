import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getChartTheme } from "./chartTheme.js";
import styles from "./ChartCard.module.css";

export default function TrendLineChart({ data = [], height = 240 }) {
  const theme = getChartTheme();

  return (
    <div style={{ width: "100%", height, direction: "ltr" }} aria-label="תרשים קו מגמת ציונים חודשית">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
          <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 12 }} />
          <YAxis domain={[40, 100]} tick={{ fill: theme.textMuted, fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderRadius: "8px",
              color: theme.text,
              direction: "rtl",
              textAlign: "right",
            }}
            formatter={(value) => [value !== null ? `${value} נק'` : "אין נתונים", "ממוצע חודשי"]}
          />
          <Line
            type="monotone"
            dataKey="average"
            name="ממוצע חודשי"
            stroke={theme.primary}
            strokeWidth={3}
            dot={{ r: 4, fill: theme.primary }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Visually hidden accessible data table */}
      <table className={styles.visuallyHidden}>
        <caption>מגמת ממוצע ציונים חודשי</caption>
        <thead>
          <tr>
            <th>חודש</th>
            <th>ממוצע</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{d.average !== null ? `${d.average} נק'` : "אין נתונים"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}