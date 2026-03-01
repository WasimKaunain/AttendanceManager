import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Clock, Camera, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";

import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/Card";
import DataTable from "@/shared/components/DataTable";
import { useNavigate } from "react-router-dom";
import { useAttendance } from "./hooks";
import AttendanceFilters from "./components/AttendanceFilters";
import AttendanceSummaryCards from "./components/AttendanceSummaryCards";
import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axios";

export default function AttendancePage() {
  const navigate = useNavigate();
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
      <div className="p-8 min-h-screen space-y-8">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

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


        <div className="space-y-6">
          {filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRecord(r)}
              className="cursor-pointer backdrop-blur-xl bg-white/60 
                         border border-white/40 
                         shadow-xl rounded-3xl p-6 
                         hover:scale-[1.02] hover:shadow-2xl 
                         transition duration-300"
            >
              <div className="flex justify-between items-center">
          
                {/* LEFT SIDE */}
                <div className="space-y-2">
          
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-slate-800">
                      {workerMap[r.worker_id] || "Unknown"}
                    </p>
          
                    <span
                      className={`px-3 py-1 text-xs rounded-full border backdrop-blur-md
                        ${
                          r.status === "Present"
                            ? "bg-green-500/20 text-green-700 border-green-500/40"
                            : r.status === "Late"
                            ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/40"
                            : "bg-red-500/20 text-red-700 border-red-500/40"
                        }`}
                    >
                      {r.status}
                    </span>
                  </div>
                      
                  <p className="text-sm text-slate-500">
                    {siteMap[r.check_out_site_id || r.check_in_site_id] || "—"}
                  </p>
                      
                  <p className="text-sm text-slate-500">
                    {format(new Date(r.date), "MMM d, yyyy")}
                  </p>
                      
                </div>
                      
                {/* RIGHT SIDE */}
                <div className="text-right space-y-2">
                      
                  <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-mono">
                      {r.check_in_time
                        ? format(new Date(r.check_in_time), "HH:mm")
                        : "—"}
                    </span>
                    {r.check_in_selfie_url && (
                      <Camera className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  
                  <div>
                    {r.geofence_valid !== false ? (
                      <span className="text-green-600 text-sm flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Valid Location
                      </span>
                    ) : (
                      <span className="text-red-500 text-sm flex items-center justify-end gap-1">
                        <XCircle className="w-4 h-4" />
                        Outside Geofence
                      </span>
                    )}
                  </div>
                  
                </div>
                  
              </div>
            </div>
          ))}
        </div>

{selectedRecord && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[1000]">

    {/* 3D CARD */}
    <div className="relative w-[720px] max-h-[90vh] overflow-y-auto 
                    rounded-3xl bg-white/70 backdrop-blur-2xl 
                    border border-white/40 shadow-[0_25px_60px_rgba(0,0,0,0.25)]
                    p-8 animate-[fadeIn_.25s_ease]">

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
        <h2 className="text-2xl font-bold text-slate-800">
          Attendance Details
        </h2>
        <p className="text-sm text-slate-500">
          Complete record overview
        </p>
      </div>

      {/* GROUP 1 — WORKER INFO */}
      <div className="bg-white/60 rounded-2xl p-5 shadow-inner border mb-6">
        <h3 className="font-semibold text-slate-700 mb-3">
          Worker Information
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <p><strong>Name:</strong> {workerMap[selectedRecord.worker_id]}</p>
          <p><strong>Status:</strong> {selectedRecord.status}</p>
          <p><strong>Date:</strong> {format(new Date(selectedRecord.date), "PPP")}</p>
          <p><strong>Geofence:</strong> {selectedRecord.geofence_valid ? "Valid" : "Outside"}</p>
        </div>
      </div>

      {/* GROUP 2 — TIME DETAILS */}
      <div className="bg-white/60 rounded-2xl p-5 shadow-inner border mb-6">
        <h3 className="font-semibold text-slate-700 mb-3">
          Time Details
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
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
          <p><strong>Is Late: </strong>{selectedRecord.is_late || "false"}</p>
        </div>
      </div>

      {/* GROUP 3 — LOCATION DETAILS */}
      <div className="bg-white/60 rounded-2xl p-5 shadow-inner border mb-6">
        <h3 className="font-semibold text-slate-700 mb-3">
          Location Details
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
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
