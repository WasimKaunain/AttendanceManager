const tabs = [
  "projects",
  "sites",
  "workers",
  "attendance",
  "shifts"
];

export default function ReportTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex gap-4 border-b pb-2">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`capitalize px-3 py-1 rounded ${
            activeTab === tab ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
