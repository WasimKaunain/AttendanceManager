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
  const [filters, setFilters] = useState({
  date: "",
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
    if (filters.date && r.date !== filters.date)
      return false;

    if (
      filters.site_id &&
      r.site_id !== filters.site_id
    )
      return false;

    if (
      filters.project_id &&
      sites.find((s) => s.id === r.site_id)
        ?.project_id !== filters.project_id
    )
      return false;

    if (
      filters.search &&
      !workerMap[r.worker_id]
        ?.toLowerCase()
        .includes(filters.search.toLowerCase())
    )
      return false;

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


      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={attendanceQuery.isLoading}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
