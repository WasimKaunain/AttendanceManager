export default function AttendanceFilters({
  filters,
  setFilters,
  projects = [],
  sites = [],
}) {
  if (!filters) return null;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-xl shadow-sm border dark:border-slate-700/50 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 items-end">
        
        {/* Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value })
              }
              className="w-full mt-1 border dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>
            
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              min={filters.start_date || undefined}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value })
              }
              className="w-full mt-1 border dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Site */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            Site
          </label>
          <select
            value={filters.site_id || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                site_id: e.target.value,
              })
            }
            className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Sites</option>
            {sites
              .filter(
                (s) =>
                  !filters.project_id ||
                  s.project_id === filters.project_id
              )
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            Worker
          </label>
          <input
            placeholder="Search worker..."
            value={filters.search || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                search: e.target.value,
              })
            }
            className="w-full border dark:border-slate-600 rounded p-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
      </div>
    </div>
  );
}
