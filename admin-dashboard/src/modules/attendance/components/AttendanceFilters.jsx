export default function AttendanceFilters({
  filters,
  setFilters,
  projects = [],
  sites = [],
}) {
  if (!filters) return null;

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Date */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600">From Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value })
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
            
          <div>
            <label className="text-sm text-slate-600">To Date</label>
            <input
              type="date"
              value={filters.end_date}
              min={filters.start_date || undefined}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value })
              }
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Project */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Project
          </label>
          <select
            value={filters.project_id || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                project_id: e.target.value,
                site_id: "",
              })
            }
            className="w-full border rounded p-2"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Site */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">
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
            className="w-full border rounded p-2"
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
          <label className="text-xs text-slate-500 block mb-1">
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
            className="w-full border rounded p-2"
          />
        </div>
      </div>
    </div>
  );
}
