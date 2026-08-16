import { RotateCcw } from "lucide-react";

export default function DiagnosticsFilterCard({
  filters,
  setFilters,
  children,
}) {
  const handleReset = () => {
    setFilters({
      search: "",
      worker_name: "",
      site_name: "",
      event_type: "",
      result: "",
      start_date: "",
      end_date: "",
      page: 1,
      limit: 20,
    });
  };

  return (
    <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                    border border-white/40 dark:border-slate-700/40
                    rounded-3xl shadow-xl p-6">

      <div className="flex items-center justify-between mb-5">

        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Filters
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Narrow down diagnostic logs
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2
                     px-4 py-2 rounded-xl
                     border border-slate-300
                     dark:border-slate-600
                     hover:bg-slate-100
                     dark:hover:bg-slate-700
                     transition"
        >
          <RotateCcw size={16} />
          Reset
        </button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {children}

      </div>

    </div>
  );
}