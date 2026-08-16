import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {ArrowLeft,MapPinned,CheckCircle2,XCircle,Percent,Eye,} from "lucide-react";

import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/Card";
import DataTable from "@/shared/components/DataTable";

import { useGeofenceLogs } from "./hooks";

import DiagnosticsFilterCard from "./components/DiagnosticsFilterCard";
import DiagnosticsSummaryCards from "./components/DiagnosticsSummaryCards";
import ResultBadge from "./components/ResultBadge";
import DetailsDrawer from "./components/DetailsDrawer";

import {formatDateTime,formatDistance,formatCoordinate,formatValue,formatPercentage,formatEventType,} from "./utils";

export default function GeofenceLogsPage() {
  const navigate = useNavigate();

  // ======================================================
  // Filters
  // ======================================================

  const [filters, setFilters] = useState({
    search: "",
    worker_name: "",
    site_name: "",
    event_type: "",
    result: "",
    start_date: "",
    end_date: "",
    page: 1,
    limit: 20,
  });

  // ======================================================
  // Drawer
  // ======================================================

  const [selectedLog, setSelectedLog] = useState(null);

  // ======================================================
  // API
  // ======================================================

  const { logsQuery } = useGeofenceLogs(filters);

  const response = logsQuery.data ?? {
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  };

  const logs = response.items;

  // ======================================================
  // Summary
  // ======================================================

  const summary = useMemo(() => {

    const total = logs.length;

    const inside = logs.filter(log => log.result).length;

    const outside = total - inside;

    const successRate =
        total === 0
            ? 0
            : (inside / total) * 100;

    return {
        total,
        inside,
        outside,
        successRate,
    };

  }, [logs]);

  // ======================================================
  // Summary Cards
  // ======================================================

    const summaryCards = [
        {
            title: "Total Checks",
            value: summary.total,
            icon: MapPinned,
        },
        {
            title: "Inside Boundary",
            value: summary.inside,
            icon: CheckCircle2,
            iconColor: "text-emerald-600 dark:text-emerald-400",
            iconBackground:
                "bg-emerald-500/20 border border-emerald-400/30",
        },
        {
            title: "Outside Boundary",
            value: summary.outside,
            icon: XCircle,
            iconColor: "text-red-600 dark:text-red-400",
            iconBackground:
                "bg-red-500/20 border border-red-400/30",
        },
        {
            title: "Success Rate",
            value: formatPercentage(summary.successRate),
            icon: Percent,
            iconColor: "text-blue-600 dark:text-blue-400",
            iconBackground:
                "bg-blue-500/20 border border-blue-400/30",
        },
    ];

  // ======================================================
  // Table Columns
  // ======================================================

  const columns = [
    {
      key: "created_at",
      label: "Date & Time",
      render: row => formatDateTime(row.created_at),
    },

    {
      key: "worker_name",
      label: "Worker",
      render: row => formatValue(row.worker_name),
    },

    {
      key: "site_name",
      label: "Site",
      render: row => formatValue(row.site_name),
    },

    {
      key: "event_type",
      label: "Event",
      render: row => formatEventType(row.event_type),
    },

    {
    key: "boundary_type",
    label: "Boundary",
    render: row => formatValue(row.boundary_type),
    },

    {
        key: "distance_m",
        label: "Distance",
        render: row => formatDistance(row.distance_m),
    },

    {
        key: "radius_m",
        label: "Radius",
        render: row =>
            row.radius_m
                ? formatDistance(row.radius_m)
                : "-",
    },

    {
      key: "result",
      label: "Result",
      render: row => (
        <ResultBadge success={row.result} />
      ),
    },

    {
      key: "actions",
      label: "Actions",
      render: row => (
        <button
          onClick={() => setSelectedLog(row)}
          className="flex items-center gap-2
                     text-indigo-600
                     hover:text-indigo-800
                     dark:text-indigo-400"
        >
          <Eye size={16} />
          View
        </button>
      ),
    },
  ]

  return (
  <DashboardLayout theme="administration">
    <div className="p-4 md:p-8 min-h-screen space-y-6">

      {/* Back Button */}

      <button
        onClick={() => navigate("/diagnostics")}
        className="flex items-center gap-2
                   text-slate-600 dark:text-slate-300
                   hover:text-indigo-600
                   transition"
      >
        <ArrowLeft size={18} />
        Back to Diagnostics
      </button>

      {/* Header */}

      <PageHeader
        title="Geofence Logs"
        subtitle="Monitor all geofence validation attempts from the AttendCrew mobile application."
      />

      {/* Filters */}

      <DiagnosticsFilterCard
        filters={filters}
        setFilters={setFilters}
      >

        {/* Search */}

        <input
          type="text"
          placeholder="Search worker, site or notes..."
          value={filters.search}
          onChange={(e) =>
            setFilters({
              ...filters,
              search: e.target.value,
              page: 1,
            })
          }
          className="rounded-xl border border-slate-300
                     dark:border-slate-700
                     bg-white dark:bg-slate-900
                     px-4 py-2"
        />

        {/* Event */}

        <select
          value={filters.event_type}
          onChange={(e) =>
            setFilters({
              ...filters,
              event_type: e.target.value,
              page: 1,
            })
          }
          className="rounded-xl border border-slate-300
                     dark:border-slate-700
                     bg-white dark:bg-slate-900
                     px-4 py-2"
        >
          <option value="">All Events</option>
          <option value="check_in">Check In</option>
          <option value="check_out">Check Out</option>
        </select>

        {/* Result */}

        <select
          value={filters.result}
          onChange={(e) =>
            setFilters({
              ...filters,
              result: 
                e.target.value === ""
                  ? ""
                  : e.target.value === "true",
              page: 1,
            })
          }
          className="rounded-xl border border-slate-300
                     dark:border-slate-700
                     bg-white dark:bg-slate-900
                     px-4 py-2"
        >
          <option value="">All Results</option>
          <option value="true">PASS</option>
          <option value="false">FAIL</option>
        </select>

        {/* Start Date */}

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
          className="rounded-xl border border-slate-300
                     dark:border-slate-700
                     bg-white dark:bg-slate-900
                     px-4 py-2"
        />

        {/* End Date */}

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
          className="rounded-xl border border-slate-300
                     dark:border-slate-700
                     bg-white dark:bg-slate-900
                     px-4 py-2"
        />

      </DiagnosticsFilterCard>

      {/* Summary */}

      <DiagnosticsSummaryCards
        cards={summaryCards}
      />

      {/* Legend */}

      <Card>
        <CardContent className="flex flex-wrap gap-6">

          <div className="flex items-center gap-2">
            <ResultBadge success />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Worker was inside the permitted boundary
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ResultBadge success={false} />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Worker was outside the permitted boundary
            </span>
          </div>

        </CardContent>
      </Card>

      {/* Table */}

      <Card>
        <CardContent className="p-0">
            <div className="overflow-x-auto">

              <DataTable
                columns={columns}
                data={logs}
                isLoading={logsQuery.isLoading}
                onRowClick={setSelectedLog}
              />

            </div>
        </CardContent>
      </Card>

      {/* Pagination */}

      <div className="flex items-center justify-between">

        <button
          disabled={response.page <= 1}
          onClick={() =>
            setFilters({
              ...filters,
              page: response.page - 1,
            })
          }
          className="px-4 py-2 rounded-xl
                     border
                     disabled:opacity-40"
        >
          Previous
        </button>

        <span className="text-sm text-slate-500">
            Page {response.page} of {response.total_pages}
            {" • "}
            {response.total} Records
        </span>

        <button
          disabled={response.page >= response.total_pages}
          onClick={() =>
            setFilters({
              ...filters,
              page: response.page + 1,
            })
          }
          className="px-4 py-2 rounded-xl
                     border
                     disabled:opacity-40"
        >
          Next
        </button>

      </div>

    </div>

    <DetailsDrawer
          open={selectedLog !== null}
          onClose={() => setSelectedLog(null)}
          title="Geofence Details"
        >
          {selectedLog && (
            <div className="space-y-6">
            
              {/* General Information */}
        
              <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                  General Information
                </h3>
        
                <div className="grid grid-cols-2 gap-4">
        
                  <div>
                    <p className="text-xs text-slate-500">Worker</p>
                    <p className="font-medium">
                      {formatValue(selectedLog.worker_name)}
                    </p>
                  </div>
        
                  <div>
                    <p className="text-xs text-slate-500">Site</p>
                    <p className="font-medium">
                      {formatValue(selectedLog.site_name)}
                    </p>
                  </div>
        
                  <div>
                    <p className="text-xs text-slate-500">Event</p>
                    <p className="font-medium">
                      {formatEventType(selectedLog.event_type)}
                    </p>
                  </div>
                    
                  <div>
                    <p className="text-xs text-slate-500">Date & Time</p>
                    <p className="font-medium">
                      {formatDateTime(selectedLog.created_at)}
                    </p>
                  </div>
                    
                </div>
              </div>
                    
              {/* Verification */}
                    
              <div>
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                  Boundary Information
                </h3>
                    
                <div className="grid grid-cols-2 gap-4">
                    
                  <div>
                    <p className="text-xs text-slate-500">
                      Boundary Type
                    </p>
                    
                    <p className="font-medium">
                      {formatValue(selectedLog.boundary_type)?.toUpperCase()}
                    </p>
                  </div>
                    
                  <div>
                    <p className="text-xs text-slate-500">
                      Radius
                    </p>
                    
                    <p className="font-medium">
                      {selectedLog.radius_m
                        ? formatDistance(selectedLog.radius_m)
                        : "-"}
                    </p>
                  </div>
                    
                  <div>
                    <p className="text-xs text-slate-500">
                      Polygon Points
                    </p>
                    
                    <p className="font-medium">
                      {formatValue(selectedLog.polygon_points)}
                    </p>
                  </div>
                    
                  <div>
                    <p className="text-xs text-slate-500">
                      Result
                    </p>
                    
                    <div className="mt-1">
                      <ResultBadge success={selectedLog.result} />
                    </div>
                  </div>
                    
                </div>
              </div>

              <div>
                  <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
                    Location Information
                  </h3>
                                    
                  <div className="grid grid-cols-2 gap-4">
                                    
                    <div>
                      <p className="text-xs text-slate-500">Site Latitude</p>
                      <p className="font-medium">
                        {formatCoordinate(selectedLog.site_lat)}
                      </p>
                    </div>
                                    
                    <div>
                      <p className="text-xs text-slate-500">Site Longitude</p>
                      <p className="font-medium">
                        {formatCoordinate(selectedLog.site_lng)}
                      </p>
                    </div>
                                    
                    <div>
                      <p className="text-xs text-slate-500">Worker Latitude</p>
                      <p className="font-medium">
                        {formatCoordinate(selectedLog.worker_lat)}
                      </p>
                    </div>
                                    
                    <div>
                      <p className="text-xs text-slate-500">Worker Longitude</p>
                      <p className="font-medium">
                        {formatCoordinate(selectedLog.worker_lng)}
                      </p>
                    </div>
                                    
                    <div>
                      <p className="text-xs text-slate-500">Distance</p>
                      <p className="font-medium">
                        {formatDistance(selectedLog.distance_m)}
                      </p>
                    </div>
                                    
                  </div>
                </div>
                    
              {/* Notes */}
                    
              <div>
                    
                <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-white">
                  Notes
                </h3>
                    
                <div
                  className="rounded-xl border border-slate-200 dark:border-slate-700
                             p-4 bg-slate-50 dark:bg-slate-800"
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {formatValue(selectedLog.notes)}
                  </div>
                </div>
                    
              </div>
            
            </div>
          )}
        </DetailsDrawer>

    </DashboardLayout>
  );
}