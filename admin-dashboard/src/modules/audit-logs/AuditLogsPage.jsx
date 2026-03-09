import { useState } from "react";
import { format } from "date-fns";
import { ScrollText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
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
  const navigate = useNavigate();
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
    <DashboardLayout theme="administration">
      <div className="p-8 min-h-screen space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <PageHeader
          title="Audit Logs"
          subtitle="Track all system activities and changes"
        />

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Action */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="check_in">Check In</option>
                <option value="check_out">Check Out</option>
              </select>
            </div>

            {/* Entity */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Entity</label>
              <select
                value={filters.entity_type}
                onChange={(e) => setFilters({ ...filters, entity_type: e.target.value, page: 1 })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">All Entities</option>
                <option value="worker">Worker</option>
                <option value="shift">Shift</option>
                <option value="site">Site</option>
                <option value="project">Project</option>
                <option value="attendance">Attendance</option>
                <option value="user">User</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <DataTable
            columns={columns}
            data={logsQuery.data || []}
            isLoading={logsQuery.isLoading}
            emptyIcon={ScrollText}
          />
        </div>

        {/* Pagination */}
        <div className="flex justify-end gap-3">
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>
          <span className="flex items-center px-3 text-sm text-slate-500">
            Page {filters.page}
          </span>
          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={!logsQuery.data || logsQuery.data.length < filters.limit}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
