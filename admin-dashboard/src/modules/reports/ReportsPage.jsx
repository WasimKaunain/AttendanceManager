import { useState } from "react";
import { ArrowLeft, FileSpreadsheet, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layout/DashboardLayout";
import ReportTabs from "./components/ReportTabs";
import FilterPanel from "./components/FilterPanel";
import { useReports } from "./hooks";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [filters, setFilters] = useState({});
  const [format, setFormat] = useState("excel");
  const navigate = useNavigate();
  const { downloadReport, loading } = useReports();

  const handleGenerate = () => {
    downloadReport({
      report_type: activeTab,
      filters,
      format,
    });
  };

  const GlassCard = ({ children }) => (
    <div className="backdrop-blur-xl bg-white/60 
                    border border-white/40 
                    shadow-2xl rounded-3xl p-6">
      {children}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 
                      bg-gradient-to-br 
                      from-slate-100 via-white to-slate-200 
                      min-h-screen">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Reports & Analytics
          </h1>
          <p className="text-slate-500 text-sm">
            Generate workforce and project insights
          </p>
        </div>

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
            onChange={setFilters}
          />
        </GlassCard>

        {/* Format Selection */}
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
                <FileSpreadsheet size={16} />
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
                <FileText size={16} />
                PDF
              </button>

            </div>

          </div>
        </GlassCard>

        {/* Generate Button */}
        <div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-8 py-3 rounded-2xl 
                       bg-gradient-to-r 
                       from-indigo-500 to-purple-600 
                       text-white font-semibold 
                       shadow-xl hover:scale-105 
                       transition-all duration-300"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
