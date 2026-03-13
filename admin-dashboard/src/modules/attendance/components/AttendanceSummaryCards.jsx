import { Users, Clock, CheckCircle2 } from "lucide-react";

export default function AttendanceSummaryCards({ records }) {
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  const todayRecords = records.filter(
    (r) => r.date === todayString
  );

  const present = todayRecords.length;

  const checkedOut = todayRecords.filter(
    (r) => r.status === "checked_out"
  ).length;

  const totalHours = todayRecords.reduce(
    (sum, r) => sum + (r.total_hours || 0),
    0
  );

  const cards = [
    {
      label: "Present Today",
      value: present,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Checked Out",
      value: checkedOut,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Total Hours",
      value: totalHours.toFixed(1) + "h",
      icon: Clock,
      color: "bg-slate-50 text-slate-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-xl shadow-sm border dark:border-slate-700/50 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-xl md:text-2xl font-semibold mt-2 dark:text-slate-100">
                  {card.value}
                </p>
              </div>

              <div
                className={`p-3 rounded-lg ${card.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
