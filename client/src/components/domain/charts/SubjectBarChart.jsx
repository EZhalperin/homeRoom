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

export default function SubjectBarChart({ data = [], height = 260 }) {
  const theme = getChartTheme();
  const hasClassAverage = data.some((d) => d.classAverage !== null && d.classAverage !== undefined);

  return (
    <div style={{ width: "100%", height, direction: "ltr" }} aria-label="תרשים עמודות ממוצעי ציונים לפי מקצוע">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
          <XAxis
            dataKey="subject"
            tick={{ fill: theme.textMuted, fontSize: 12 }}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis domain={[0, 100]} tick={{ fill: theme.textMuted, fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderRadius: "8px",
              color: theme.text,
              direction: "rtl",
              textAlign: "right",
            }}
            formatter={(value, name) => [`${value} נק'`, name]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ direction: "rtl", paddingBottom: "10px", fontSize: "12px" }}
          />
          <Bar
            dataKey="average"
            name={hasClassAverage ? "ציון התלמיד" : "ממוצע"}
            fill={theme.primary}
            radius={[4, 4, 0, 0]}
          />
          {hasClassAverage && (
            <Bar
              dataKey="classAverage"
              name="ממוצע כיתתי"
              fill={theme.secondary}
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Visually hidden accessible data table for screen readers */}
      <table className={styles.visuallyHidden}>
        <caption>ממוצעי ציונים לפי מקצוע</caption>
        <thead>
          <tr>
            <th>מקצוע</th>
            <th>ציון</th>
            {hasClassAverage && <th>ממוצע כיתתי</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.subject}>
              <td>{d.subject}</td>
              <td>{d.average}</td>
              {hasClassAverage && <td>{d.classAverage ?? "לא זמין"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}