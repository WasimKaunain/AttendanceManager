import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import {
  ScanFace,
  MapPinned,
  Activity,
  Bug,
} from "lucide-react";

export default function DiagnosticsPage() {
  const navigate = useNavigate();

  const DiagnosticCard = ({ title, description, icon: Icon, onClick }) => (
    <div
      onClick={onClick}
      className="cursor-pointer backdrop-blur-xl bg-white/60 dark:bg-slate-800/60
                 border border-white/40 dark:border-slate-700/40 shadow-xl
                 rounded-3xl p-5 md:p-6 hover:scale-[1.02]
                 hover:shadow-2xl transition duration-300"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 md:p-4 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 shrink-0">
          <Icon
            className="text-indigo-600 dark:text-indigo-400"
            size={24}
          />
        </div>

        <div>
          <h2 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout theme="administration">
      <div className="p-4 md:p-8 min-h-screen space-y-6 md:space-y-8">

        <PageHeader
          title="Diagnostics"
          subtitle="Monitor system health, face recognition, geofence validation and application diagnostics"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8">

          <DiagnosticCard
            title="Face Recognition Logs"
            description="Inspect successful and failed face verification attempts"
            icon={ScanFace}
            onClick={() => navigate("/diagnostics/face-logs")}
          />

          <DiagnosticCard
            title="Geofence Logs"
            description="Monitor location validation and boundary verification events"
            icon={MapPinned}
            onClick={() => navigate("/diagnostics/geofence-logs")}
          />

          <DiagnosticCard
            title="System Health"
            description="View server, database and application health status"
            icon={Activity}
            onClick={() => navigate("/diagnostics/system-health")}
          />

          <DiagnosticCard
            title="API Error Logs"
            description="Inspect backend exceptions and failed API requests"
            icon={Bug}
            onClick={() => navigate("/diagnostics/api-errors")}
          />

        </div>
      </div>
    </DashboardLayout>
  );
}