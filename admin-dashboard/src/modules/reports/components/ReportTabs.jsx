const tabs = [
  { key: "projects", label: "Projects" },
  { key: "sites", label: "Sites" },
  { key: "workers", label: "Workers" },
  { key: "attendance_sitewise", label: "Attendance (Sitewise)" },
  { key: "attendance_workerwise", label: "Attendance (Workerwise)" },
];

export default function ReportTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex flex-wrap gap-3 border-b pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
            ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white shadow"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}