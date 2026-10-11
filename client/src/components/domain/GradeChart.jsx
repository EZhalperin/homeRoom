import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** @param {{ averages: Record<string, number>|null }} props */
export default function GradeChart({ averages }) {
  const data = Object.entries(averages || {}).map(([subject, avg]) => ({
    subject, avg: Math.round(avg * 10) / 10,
  }));
  if (data.length === 0) return <p className="muted">אין עדיין ציונים להצגה</p>;

  return (
    // Numeric axes read left-to-right even in Hebrew.
    <div dir="ltr" style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="subject" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="avg" name="ממוצע משוקלל" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
