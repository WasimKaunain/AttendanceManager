import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axios";

export default function FilterPanel({ reportType, filters, onChange }) {
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/projects/")).data,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await api.get("/sites/")).data,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => (await api.get("/workers/")).data,
  });

  const handleChange = (key, value) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">

      {/* PROJECT REPORT */}
      {reportType === "projects" && (
        <select
          value={filters?.project_id || ""}
          onChange={(e) => handleChange("project_id", e.target.value)}
          className="border p-3 rounded-xl"
        >
          <option value="">Select Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* SITE REPORT */}
      {reportType === "sites" && (
        <select
          value={filters?.site_id || ""}
          onChange={(e) => handleChange("site_id", e.target.value)}
          className="border p-3 rounded-xl"
        >
          <option value="">Select Site</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {/* WORKER REPORT */}
      {reportType === "workers" && (
        <select
          value={filters?.worker_id || ""}
          onChange={(e) => handleChange("worker_id", e.target.value)}
          className="border p-3 rounded-xl"
        >
          <option value="">Select Worker</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.full_name}
            </option>
          ))}
        </select>
      )}

      {/* ATTENDANCE SITEWISE */}
      {reportType === "attendance_sitewise" && (
        <>
          <select
            value={filters?.site_id || ""}
            onChange={(e) => handleChange("site_id", e.target.value)}
            className="border p-3 rounded-xl"
          >
            <option value="">Select Site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters?.from_date || ""}
            onChange={(e) => handleChange("from_date", e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="date"
            value={filters?.to_date || ""}
            min={filters?.from_date || undefined}
            onChange={(e) => handleChange("to_date", e.target.value)}
            className="border p-3 rounded-xl"
          />
        </>
      )}

      {/* ATTENDANCE WORKERWISE */}
      {reportType === "attendance_workerwise" && (
        <>
          <select
            value={filters?.worker_id || ""}
            onChange={(e) => handleChange("worker_id", e.target.value)}
            className="border p-3 rounded-xl"
          >
            <option value="">Select Worker</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters?.from_date || ""}
            onChange={(e) => handleChange("from_date", e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="date"
            value={filters?.to_date || ""}
            min={filters?.from_date || undefined}
            onChange={(e) => handleChange("to_date", e.target.value)}
            className="border p-3 rounded-xl"
          />
        </>
      )}

    </div>
  );
}