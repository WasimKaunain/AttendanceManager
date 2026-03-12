const tabs = [
  { key: "projects", label: "Projects" },
  { key: "sites", label: "Sites" },
  { key: "workers", label: "Workers" },
  { key: "attendance_sitewise", label: "Attendance (Sitewise)" },
  { key: "attendance_workerwise", label: "Attendance (Workerwise)" },
];

export default function ReportTabs({ activeTab, setActiveTab }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-2 md:gap-3 border-b dark:border-slate-700/50 pb-3 whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 md:px-4 py-2 rounded-xl text-sm font-medium transition shrink-0
              ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}