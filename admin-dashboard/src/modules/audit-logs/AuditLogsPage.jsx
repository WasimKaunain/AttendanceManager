import { useState } from "react";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";

import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/Card";
import DataTable from "@/shared/components/DataTable";

import { useAuditLogs } from "./hooks";

const actionColors = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  check_in: "bg-amber-100 text-amber-700",
  check_out: "bg-purple-100 text-purple-700",
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    action: "",
    entity_type: "",
    start_date: "",
    end_date: "",
    page: 1,
    limit: 20,
  });

  const { logsQuery } = useAuditLogs(filters);

  const columns = [
    {
      key: "created_at",
      label: "Timestamp",
      render: (r) => (
        <span className="text-xs text-slate-500 font-mono">
          {format(new Date(r.created_at), "MMM d, yyyy HH:mm")}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (r) => (
        <span
          className={`px-2 py-1 text-xs rounded-md ${
            actionColors[r.action] ||
            "bg-slate-100 text-slate-600"
          }`}
        >
          {r.action}
        </span>
      ),
    },
    {
      key: "entity_type",
      label: "Entity",
      render: (r) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
          {r.entity_type}
        </span>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (r) => (
        <span className="text-xs text-slate-600 truncate block max-w-xs">
          {r.details || "—"}
        </span>
      ),
    },
    {
      key: "performed_by",
      label: "By",
      render: (r) => (
        <span className="text-xs">
          {r.performed_by || "System"}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Audit Logs"
        subtitle="Track all system activities and changes"
      />

      {/* FILTER SECTION */}
      <div className="bg-white p-5 rounded-xl shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Action */}
          <select
            value={filters.action}
            onChange={(e) =>
              setFilters({
                ...filters,
                action: e.target.value,
                page: 1,
              })
            }
            className="border rounded p-2"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="check_in">Check In</option>
            <option value="check_out">Check Out</option>
          </select>

          {/* Entity */}
          <select
            value={filters.entity_type}
            onChange={(e) =>
              setFilters({
                ...filters,
                entity_type: e.target.value,
                page: 1,
              })
            }
            className="border rounded p-2"
          >
            <option value="">All Entities</option>
            <option value="worker">Worker</option>
            <option value="shift">Shift</option>
            <option value="site">Site</option>
            <option value="project">Project</option>
            <option value="attendance">Attendance</option>
          </select>

        {/* Start Date */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) =>
              setFilters({
                ...filters,
                start_date: e.target.value,
                page: 1,
              })
            }
            className="w-full border rounded p-2 text-sm"
          />
        </div>
        
        {/* End Date */}
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            End Date
          </label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) =>
              setFilters({
                ...filters,
                end_date: e.target.value,
                page: 1,
              })
            }
            className="w-full border rounded p-2 text-sm"
          />
        </div>

        </div>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={logsQuery.data || []}
            isLoading={logsQuery.isLoading}
            emptyIcon={ScrollText}
          />
        </CardContent>
      </Card>

      {/* PAGINATION */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          disabled={filters.page === 1}
          onClick={() =>
            setFilters({
              ...filters,
              page: filters.page - 1,
            })
          }
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={() =>
            setFilters({
              ...filters,
              page: filters.page + 1,
            })
          }
          className="px-3 py-1 border rounded"
        >
          Next
        </button>
      </div>
    </DashboardLayout>
  );
}
