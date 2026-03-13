import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import DashboardLayout from "@/layout/DashboardLayout";
import ReportTabs from "./components/ReportTabs";
import FilterPanel from "./components/FilterPanel";
import { useReports } from "./hooks";
import PageHeader from "@/shared/components/PageHeader";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("projects");
  const [filters, setFilters] = useState({});
  const [format, setFormat] = useState("excel");
  const { downloadReport, loading } = useReports();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleGenerate = async () => {
    const finalFormat =
      activeTab === "attendance_sitewise" ||
      activeTab === "attendance_workerwise"
        ? format
        : "pdf";

    // helper to build filters for single-id requests
    const buildSingleFilter = (key, id) => {
      const f = { ...(filters || {}) };
      // remove multi-select arrays if present
      delete f.project_ids;
      delete f.site_ids;
      delete f.worker_ids;
      f[key] = id;
      return f;
    };

    const payloads = [];

    switch (activeTab) {
      case "projects": {
        const ids = Array.isArray(filters?.project_ids) ? filters.project_ids : [];
        ids.forEach((id) =>
          payloads.push({ report_type: activeTab, filters: buildSingleFilter("project_id", id), format: finalFormat })
        );
        break;
      }

      case "sites": {
        const ids = Array.isArray(filters?.site_ids) ? filters.site_ids : [];
        ids.forEach((id) =>
          payloads.push({ report_type: activeTab, filters: buildSingleFilter("site_id", id), format: finalFormat })
        );
        break;
      }

      case "workers": {
        const ids = Array.isArray(filters?.worker_ids) ? filters.worker_ids : [];
        ids.forEach((id) =>
          payloads.push({ report_type: activeTab, filters: buildSingleFilter("worker_id", id), format: finalFormat })
        );
        break;
      }

      case "attendance_sitewise": {
        const ids = Array.isArray(filters?.site_ids) ? filters.site_ids : [];
        ids.forEach((id) =>
          payloads.push({ report_type: activeTab, filters: buildSingleFilter("site_id", id), format: finalFormat })
        );
        break;
      }

      case "attendance_workerwise": {
        const ids = Array.isArray(filters?.worker_ids) ? filters.worker_ids : [];
        ids.forEach((id) =>
          payloads.push({ report_type: activeTab, filters: buildSingleFilter("worker_id", id), format: finalFormat })
        );
        break;
      }

      default:
        break;
    }

    // sequentially download each report to avoid overwhelming the server
    for (const p of payloads) {
      await downloadReport(p);
    }
  };

  const GlassCard = ({ children }) => (
    <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                    border border-white/40 dark:border-slate-700/40
                    shadow-2xl rounded-3xl p-4 md:p-6">
      {children}
    </div>
  );

  const isAttendance =
    activeTab === "attendance_sitewise" ||
    activeTab === "attendance_workerwise";

  const isValidDateRange =
    !filters?.from_date ||
    !filters?.to_date ||
    new Date(filters.to_date) >= new Date(filters.from_date);

  const isValidFilters = (() => {
    switch (activeTab) {
      case "projects":
        return Array.isArray(filters?.project_ids) && filters.project_ids.length > 0;

      case "sites":
        return Array.isArray(filters?.site_ids) && filters.site_ids.length > 0;

      case "workers":
        return Array.isArray(filters?.worker_ids) && filters.worker_ids.length > 0;

      case "attendance_sitewise":
        return (
          Array.isArray(filters?.site_ids) &&
          filters.site_ids.length > 0 &&
          !!filters?.from_date &&
          !!filters?.to_date &&
          isValidDateRange
        );

      case "attendance_workerwise":
        return (
          Array.isArray(filters?.worker_ids) &&
          filters.worker_ids.length > 0 &&
          !!filters?.from_date &&
          !!filters?.to_date &&
          isValidDateRange
        );

      default:
        return false;
    }
  })();

  return (
    <DashboardLayout theme="reports">
      <div className="p-4 md:p-8 min-h-screen space-y-5 md:space-y-8">

        {/* Header */}
        <PageHeader
          title="Reports & Analytics"
          subtitle="Generate workforce and project insights"
        />

        {/* Tabs */}
        <GlassCard>
          <ReportTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </GlassCard>

        {/* Filters */}
        <GlassCard>
          <FilterPanel
            reportType={activeTab}
            filters={filters}
            onChange={setFilters}
          />
        </GlassCard>

        {/* Format Selection (Only for Attendance Reports) */}
          {(activeTab === "attendance_sitewise" ||
            activeTab === "attendance_workerwise") && (
            <GlassCard>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Export Format:
                </div>
            
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormat("excel")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition text-sm
                    ${
                      format === "excel"
                        ? "bg-green-500/20 border-green-400/40 text-green-700 dark:text-green-400"
                        : "bg-white/40 dark:bg-slate-700/40 border-white/40 dark:border-slate-600/40 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Excel
                  </button>
                  
                  <button
                    onClick={() => setFormat("pdf")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition text-sm
                    ${
                      format === "pdf"
                        ? "bg-red-500/20 border-red-400/40 text-red-700 dark:text-red-400"
                        : "bg-white/40 dark:bg-slate-700/40 border-white/40 dark:border-slate-600/40 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    PDF
                  </button>
                </div>
              </div>
            </GlassCard>
          )}

        {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !isValidFilters}
            className={`w-full sm:w-auto px-8 py-3 rounded-2xl 
              bg-gradient-to-r 
              from-indigo-500 to-purple-600 
              text-white font-semibold 
              shadow-xl transition-all duration-300
              ${
                loading || !isValidFilters
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:scale-105"
              }`}
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>

      </div>
    </DashboardLayout>
  );
}
