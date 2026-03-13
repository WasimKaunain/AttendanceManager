import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Clock, Camera, CheckCircle2, XCircle } from "lucide-react";

import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/Card";
import DataTable from "@/shared/components/DataTable";
import { useAttendance } from "./hooks";
import AttendanceFilters from "./components/AttendanceFilters";
import AttendanceSummaryCards from "./components/AttendanceSummaryCards";
import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axios";

export default function AttendancePage() {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({
  start_date: "",
  end_date: "",
  project_id: "",
  site_id: "",
  search: "",
  });

  const { attendanceQuery } = useAttendance();
  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await api.get("/sites/")).data,
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => (await api.get("/workers/")).data,
  });

  const { data: projects = [] } = useQuery({
  queryKey: ["projects"],
  queryFn: async () => (await api.get("/projects/")).data,
  });


  const workerMap = Object.fromEntries(
    workers.map((w) => [w.id, w.full_name])
  );

  const siteMap = Object.fromEntries(
    sites.map((s) => [s.id, s.name])
  );

const filtered = useMemo(() => {
  return (attendanceQuery.data || []).filter((r) => {

    // DATE FILTER
    if (filters.start_date) {
      const recordDate = new Date(r.date + "T00:00:00");
      const startDate = new Date(filters.start_date + "T00:00:00");
      if (recordDate < startDate) return false;
    }

    if (filters.end_date) {
      const recordDate = new Date(r.date + "T00:00:00");
      const endDate = new Date(filters.end_date + "T23:59:59");
      if (recordDate > endDate) return false;
    }

    // SITE FILTER
    if (
      filters.site_id &&
      r.check_in_site_id !== filters.site_id &&
      r.check_out_site_id !== filters.site_id
    ) {
      return false;
    }

    // PROJECT FILTER
    if (filters.project_id) {
      const site = sites.find(
        (s) =>
          s.id === r.check_in_site_id ||
          s.id === r.check_out_site_id
      );

      if (!site || site.project_id !== filters.project_id) {
        return false;
      }
    }

    // SEARCH FILTER
    if (
      filters.search &&
      !workerMap[r.worker_id]
        ?.toLowerCase()
        .includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });
}, [attendanceQuery.data, filters, workerMap, sites]);


  const columns = [
    {
      key: "worker",
      label: "Worker",
      render: (r) => (
        <div>
          <p className="font-medium text-sm">
            {workerMap[r.worker_id] || "Unknown"}
          </p>
          <p className="text-xs text-slate-400">
            {siteMap[r.site_id] || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (r) =>
        format(new Date(r.date), "MMM d, yyyy"),
    },

    {
      key: "check_in_time",
      label: "Check In",
      render: (r) => (
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="font-mono">
            {r.check_in_time
              ? format(new Date(r.check_in_time), "HH:mm")
              : "—"}
          </span>
          {r.check_in_selfie_url && (
            <Camera className="w-3 h-3 text-blue-400" />
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className="px-2 py-1 text-xs rounded-md bg-emerald-100 text-emerald-700">
          {r.status}
        </span>
      ),
    },
    {
      key: "geofence",
      label: "Geofence",
      render: (r) =>
        r.geofence_valid !== false ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400" />
        ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5">

      <PageHeader
        title="Attendance"
        subtitle={`${filtered.length} records`}
      />
  
      <AttendanceSummaryCards
        records={attendanceQuery.data || []}
      />

      <AttendanceFilters
        filters={filters}
        setFilters={setFilters}
        projects={projects}
        sites={sites}
      />


      {/* ATTENDANCE LIST — scrollable card */}
      <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 shadow-xl rounded-3xl overflow-hidden">

        {/* Card header */}
        <div className="px-5 py-3 border-b border-white/40 dark:border-slate-700/40 flex flex-wrap items-center justify-between gap-y-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Attendance Records</span>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-green-400 shadow-[0_0_5px_rgba(74,222,128,0.6)]" />
              Checked Out
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.6)]" />
              On Site
            </span>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">|</span>
            <span>{filtered.length} records</span>
          </div>
        </div>

        {/* Scrollable table wrapper — horizontal scroll on mobile */}
        <div className="overflow-x-auto">
          <div className="min-w-[660px]">
            {/* Column headers */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.8fr] gap-0 px-5 py-2 bg-slate-50/60 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700/60 text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wide">
              <span>Worker / Site</span>
              <span>Date</span>
              <span>Check In</span>
              <span>Check Out</span>
              <span>Hours</span>
              <span>Status</span>
              <span className="text-right">Geofence</span>
            </div>

            {/* Scrollable rows */}
            <div className="overflow-y-auto max-h-[55vh] custom-scrollbar divide-y divide-slate-100/60 dark:divide-slate-700/40">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                  <p className="text-sm font-medium">No records found</p>
                  <p className="text-xs">Try adjusting your filters</p>
                </div>
              ) : (
                filtered.map((r) => {
                  const isCheckedOut = !!r.check_out_time;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      className={`grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.8fr] gap-0 px-5 py-3
                                  cursor-pointer hover:bg-white/70 dark:hover:bg-slate-700/50 transition-all duration-150
                                  ${isCheckedOut
                                    ? "border-l-[3px] border-l-green-400 shadow-[inset_4px_0_8px_rgba(74,222,128,0.08)]"
                                    : "border-l-[3px] border-l-yellow-400 shadow-[inset_4px_0_8px_rgba(250,204,21,0.08)]"
                                  }`}
                    >
                  {/* Worker / Site */}
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {workerMap[r.worker_id] || "Unknown"}
                    </span>
                    <span className="text-xs text-slate-400 truncate">
                      {siteMap[r.check_in_site_id] || "—"}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-sm text-slate-600">
                    {format(new Date(r.date), "MMM d, yyyy")}
                  </div>

                  {/* Check In */}
                  <div className="flex items-center gap-1.5 text-sm font-mono text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    {r.check_in_time ? format(new Date(r.check_in_time), "HH:mm") : "—"}
                    {r.check_in_selfie_url && <Camera className="w-3 h-3 text-blue-400" />}
                  </div>

                  {/* Check Out */}
                  <div className="flex items-center gap-1.5 text-sm font-mono text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    {r.check_out_time ? format(new Date(r.check_out_time), "HH:mm") : (
                      <span className="text-yellow-500 text-xs not-italic">On site</span>
                    )}
                    {r.check_out_selfie_url && <Camera className="w-3 h-3 text-blue-400" />}
                  </div>

                  {/* Hours */}
                  <div className="flex items-center text-sm text-slate-600">
                    {r.total_hours != null ? (
                      <span>{r.total_hours.toFixed(1)}h</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium
                      ${r.status === "present" || r.status === "checked_out"
                        ? "bg-green-100 text-green-700"
                        : r.status === "late"
                        ? "bg-yellow-100 text-yellow-700"
                        : r.status === "checked_in"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-red-100 text-red-600"
                      }`}>
                      {r.status}
                    </span>
                  </div>

                  {/* Geofence */}
                  <div className="flex items-center justify-end">
                    {r.geofence_valid !== false ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
            </div>
          </div>
        </div>
      </div>

{selectedRecord && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center z-[1000]">

    {/* 3D CARD */}
    <div className="relative w-full sm:w-[720px] max-h-[90vh] overflow-y-auto 
                    rounded-t-3xl sm:rounded-3xl bg-white/90 dark:bg-slate-800/95 backdrop-blur-2xl 
                    border border-white/40 dark:border-slate-700/40 shadow-[0_25px_60px_rgba(0,0,0,0.25)]
                    p-6 sm:p-8 animate-[fadeIn_.25s_ease]">

      {/* CLOSE BUTTON */}
      <button
        onClick={() => setSelectedRecord(null)}
        className="absolute top-5 right-5 w-10 h-10 rounded-full 
                   bg-gradient-to-br from-red-400 to-red-600 
                   text-white font-bold shadow-lg 
                   hover:scale-110 hover:rotate-90 
                   transition-all duration-300"
      >
        ✕
      </button>

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
          Attendance Details
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Complete record overview
        </p>
      </div>

      {/* GROUP 1 — WORKER INFO */}
      <div className="bg-white/60 dark:bg-slate-700/50 rounded-2xl p-4 sm:p-5 shadow-inner border dark:border-slate-600/40 mb-6">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Worker Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
          <p><strong>Name:</strong> {workerMap[selectedRecord.worker_id]}</p>
          <p><strong>Status:</strong> {selectedRecord.status}</p>
          <p><strong>Date:</strong> {format(new Date(selectedRecord.date), "PPP")}</p>
          <p><strong>Geofence:</strong> {selectedRecord.geofence_valid ? "Valid" : "Outside"}</p>
        </div>
      </div>

      {/* GROUP 2 — TIME DETAILS */}
      <div className="bg-white/60 dark:bg-slate-700/50 rounded-2xl p-4 sm:p-5 shadow-inner border dark:border-slate-600/40 mb-6">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Time Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            <strong>Check-in:</strong>{" "}
            {selectedRecord.check_in_time
              ? format(new Date(selectedRecord.check_in_time), "HH:mm")
              : "—"}
          </p>

          <p>
            <strong>Check-out:</strong>{" "}
            {selectedRecord.check_out_time
              ? format(new Date(selectedRecord.check_out_time), "HH:mm")
              : "—"}
          </p>

          <p><strong>Total Hours:</strong> {selectedRecord.total_hours || 0}</p>
          <p><strong>Overtime:</strong> {selectedRecord.overtime_hours || 0}</p>
        </div>
      </div>

      {/* GROUP 3 — LOCATION DETAILS */}
      <div className="bg-white/60 dark:bg-slate-700/50 rounded-2xl p-4 sm:p-5 shadow-inner border dark:border-slate-600/40 mb-6">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Location Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            <strong>Check-in Site:</strong><br/>
            {siteMap[selectedRecord.check_in_site_id] || "-"}
          </p>

          <p>
            <strong>Check-out Site:</strong><br/>
            {siteMap[selectedRecord.check_out_site_id] || "-"}
          </p>
        </div>
      </div>

    </div>
  </div>
)}
    </div>
    </DashboardLayout>
  );
}
