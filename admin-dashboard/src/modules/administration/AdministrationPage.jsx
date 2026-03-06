import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import { Users, Database, FileText, FolderOpen } from "lucide-react";
import { useState } from "react";

export default function AdministrationPage() {
  const navigate = useNavigate();
  const {dialogOpen, setDialogOpen} = useState(false);
  const AdminCard = ({ title, description, icon: Icon, onClick }) => (
    <div
      onClick={onClick}
      className="cursor-pointer backdrop-blur-xl bg-white/60 
                 border border-white/40 shadow-xl 
                 rounded-3xl p-6 hover:scale-[1.02] 
                 hover:shadow-2xl transition duration-300"
    >
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-indigo-500/20 border border-indigo-400/40">
          <Icon className="text-indigo-600" size={28} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            {title}
          </h2>
          <p className="text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout theme="administration">
      <div className="p-8 min-h-screen space-y-8">

        <PageHeader
          title="Administration"
          subtitle="System control and privileged operations"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">

          <AdminCard
            title="User Management"
            description="Create and manage system users and roles"
            icon={Users}
            onClick={() => navigate("/users")}
          />

          <AdminCard
            title="Data Management"
            description="Archive, restore or permanently delete records"
            icon={Database}
            onClick={() => navigate("/data-management")}
          />

          <AdminCard
            title="Audit Logs"
            description="View system activity and security logs"
            icon={FileText}
            onClick={() => navigate("/audit-logs")}
          />

          <AdminCard
            title="Media Repository"
            description="Browse attendance images and worker assets"
            icon={FolderOpen}
            onClick={() => navigate("/media-repository")}
          />

        </div>
      </div>
    </DashboardLayout>
  );
}