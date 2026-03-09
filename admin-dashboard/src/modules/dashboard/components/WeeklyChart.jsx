import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.fill }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function WeeklyChart({ data }) {
  const hasData = data && data.some((d) => d.present > 0 || d.absent > 0);

  return (
    <div className="w-full h-80">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-md font-semibold text-slate-800 dark:text-slate-100">
            Weekly Attendance Trend
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Last 7 days — Present vs Absent per day
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            Present
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
            Absent
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-56 text-slate-400 dark:text-slate-500 gap-3">
          <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium">No attendance data this week</p>
          <p className="text-xs text-center max-w-[200px]">
            Once workers start checking in, daily trends will appear here.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data} barCategoryGap="30%" barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Bar
              dataKey="present"
              name="Present"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              animationDuration={700}
            />
            <Bar
              dataKey="absent"
              name="Absent"
              fill="#f87171"
              radius={[6, 6, 0, 0]}
              animationDuration={900}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
