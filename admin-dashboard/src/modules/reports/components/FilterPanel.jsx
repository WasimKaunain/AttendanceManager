import { useState } from "react";

const filterConfig = {
  attendance: ["project", "site", "worker", "date_range"],
  projects: ["status", "date_range"],
  workers: ["project", "site", "status"],
  sites: ["project", "status"],
  shifts: ["status"]
};

export default function FilterPanel({ reportType, onChange }) {
  const [filters, setFilters] = useState({});

  const handleChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onChange(updated);
  };

  const activeFilters = filterConfig[reportType] || [];

  return (
    <div className="grid grid-cols-3 gap-4 mt-4">
      {activeFilters.includes("project") && (
        <input
          placeholder="Project ID"
          onChange={(e) => handleChange("project_id", e.target.value)}
          className="border p-2 rounded"
        />
      )}

      {activeFilters.includes("site") && (
        <input
          placeholder="Site ID"
          onChange={(e) => handleChange("site_id", e.target.value)}
          className="border p-2 rounded"
        />
      )}

      {activeFilters.includes("worker") && (
        <input
          placeholder="Worker ID"
          onChange={(e) => handleChange("worker_id", e.target.value)}
          className="border p-2 rounded"
        />
      )}

      {activeFilters.includes("date_range") && (
        <>
          <input
            type="date"
            onChange={(e) => handleChange("from_date", e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="date"
            onChange={(e) => handleChange("to_date", e.target.value)}
            className="border p-2 rounded"
          />
        </>
      )}

      {activeFilters.includes("status") && (
        <select
          onChange={(e) => handleChange("status", e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      )}
    </div>
  );
}
