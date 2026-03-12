import { useState } from "react";
import { format } from "date-fns";
import { ScrollText, ArrowLeft, User, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import DataTable from "@/shared/components/DataTable";

import { useAuditLogs } from "./hooks";

const actionColors = {
  create:               "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  update:               "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  delete:               "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  force_delete:         "bg-red-200 text-red-800 dark:bg-red-700/20 dark:text-red-300",
  archive:              "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  restore:              "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  check_in:             "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  check_out:            "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  face_enrolled:        "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400",
  payroll_entry_add:    "bg-lime-100 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400",
  payroll_entry_delete: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  report_download:      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
};

const roleIcon = {
  admin:         <ShieldCheck size={12} className="inline mr-1 text-blue-500" />,
  site_incharge: <User       size={12} className="inline mr-1 text-emerald-500" />,
};

const roleLabel = {
  admin:         "(Admin)",
  site_incharge: "(Site Incharge)",
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    action: "",
    entity_type: "",
    performed_by_name: "",
    performed_by_role: "",
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
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {format(new Date(r.created_at), "MMM d, yyyy HH:mm")}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (r) => (
        <span className={`px-2 py-1 text-xs rounded-md font-medium ${actionColors[r.action] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"}`}>
          {r.action.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "entity_type",
      label: "Entity",
      render: (r) => (
        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded">
          {r.entity_type}
        </span>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (r) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 truncate block max-w-xs" title={r.details}>
          {r.details || "—"}
        </span>
      ),
    },
    {
      key: "performed_by_name",
      label: "By",
      render: (r) => {
        const role = r.performed_by_role || "admin";
        const name = r.performed_by_name || "Unknown";
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {roleIcon[role] ?? roleIcon.admin}
              {name}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 pl-4">
              {roleLabel[role] ?? "(Admin)"}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout theme="administration">
      <div className="p-4 md:p-8 min-h-screen space-y-5 md:space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <PageHeader
          title="Audit Logs"
          subtitle="Track all system activities — who did what and when"
        />

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800/60 dark:border dark:border-slate-700/50 p-5 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Filters</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {/* Action */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="force_delete">Force Delete</option>
                <option value="archive">Archive</option>
                <option value="restore">Restore</option>
                <option value="check_in">Check In</option>
                <option value="check_out">Check Out</option>
                <option value="face_enrolled">Face Enroll</option>
                <option value="payroll_entry_add">Payroll Entry Add</option>
                <option value="payroll_entry_delete">Payroll Entry Delete</option>
                <option value="report_download">Report Download</option>
              </select>
            </div>

            {/* Entity */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Entity</label>
              <select
                value={filters.entity_type}
                onChange={(e) => setFilters({ ...filters, entity_type: e.target.value, page: 1 })}
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Entities</option>
                <option value="worker">Worker</option>
                <option value="shift">Shift</option>
                <option value="site">Site</option>
                <option value="project">Project</option>
                <option value="attendance">Attendance</option>
                <option value="user">User</option>
                <option value="report">Report</option>
              </select>
            </div>

            {/* Performed By Role */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Role</label>
              <select
                value={filters.performed_by_role}
                onChange={(e) => setFilters({ ...filters, performed_by_role: e.target.value, page: 1 })}
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="site_incharge">Site Incharge</option>
              </select>
            </div>

            {/* Performed By Name (text search) */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Person Name</label>
              <input
                type="text"
                placeholder="Search by name…"
                value={filters.performed_by_name}
                onChange={(e) => setFilters({ ...filters, performed_by_name: e.target.value, page: 1 })}
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-500 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value, page: 1 })}
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">End Date</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value, page: 1 })}
                className="w-full border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  action: "", entity_type: "", performed_by_name: "",
                  performed_by_role: "", start_date: "", end_date: "", page: 1, limit: 20,
                })}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">{roleIcon.admin} <span className="font-medium text-slate-700 dark:text-slate-200">Admin</span> — dashboard user</span>
          <span className="flex items-center gap-1">{roleIcon.site_incharge} <span className="font-medium text-slate-700 dark:text-slate-200">Site Incharge</span> — mobile app user</span>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800/60 dark:border dark:border-slate-700/50 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
          <div className="min-w-[640px]">
            <DataTable
              columns={columns}
              data={logsQuery.data || []}
              isLoading={logsQuery.isLoading}
              emptyIcon={ScrollText}
            />
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {logsQuery.data ? `Showing ${logsQuery.data.length} record(s)` : ""}
          </p>
          <div className="flex gap-2 sm:gap-3">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="px-3 sm:px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            <span className="flex items-center px-3 text-sm text-slate-500 dark:text-slate-400">
              Page {filters.page}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              disabled={!logsQuery.data || logsQuery.data.length < filters.limit}
              className="px-3 sm:px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
