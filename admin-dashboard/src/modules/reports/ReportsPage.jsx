import { useState } from "react";
import { ArrowLeft, FileSpreadsheet, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layout/DashboardLayout";
import ReportTabs from "./components/ReportTabs";
import FilterPanel from "./components/FilterPanel";
import { useReports } from "./hooks";
import PageHeader from "@/shared/components/PageHeader";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("projects");
  const [filters, setFilters] = useState({});
  const [format, setFormat] = useState("excel");
  const navigate = useNavigate();
  const { downloadReport, loading } = useReports();
  const [dialogOpen, setDialogOpen] = useState(false);

const handleGenerate = () => {
  const finalFormat =
    activeTab === "attendance_sitewise" ||
    activeTab === "attendance_workerwise"
      ? format
      : "pdf";

  downloadReport({
    report_type: activeTab,
    filters,
    format: finalFormat,
  });
  };

  const GlassCard = ({ children }) => (
    <div className="backdrop-blur-xl bg-white/60 
                    border border-white/40 
                    shadow-2xl rounded-3xl p-6">
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
        return !!filters?.project_id;

      case "sites":
        return !!filters?.site_id;

      case "workers":
        return !!filters?.worker_id;

      case "attendance_sitewise":
        return (
          !!filters?.site_id &&
          !!filters?.from_date &&
          !!filters?.to_date &&
          isValidDateRange
        );

      case "attendance_workerwise":
        return (
          !!filters?.worker_id &&
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
      <div className="p-8 min-h-screen space-y-8 ">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

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
              <div className="flex gap-6 items-center">
                <div className="text-sm font-medium text-slate-700">
                  Export Format:
                </div>
            
                <div className="flex gap-4">
                  <button
                    onClick={() => setFormat("excel")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition
                    ${
                      format === "excel"
                        ? "bg-green-500/20 border-green-400/40 text-green-700"
                        : "bg-white/40 border-white/40"
                    }`}
                  >
                    Excel
                  </button>
                  
                  <button
                    onClick={() => setFormat("pdf")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition
                    ${
                      format === "pdf"
                        ? "bg-red-500/20 border-red-400/40 text-red-700"
                        : "bg-white/40 border-white/40"
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
            className={`px-8 py-3 rounded-2xl 
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
