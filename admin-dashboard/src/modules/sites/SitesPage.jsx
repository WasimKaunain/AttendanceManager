import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axios";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";

export default function SitesPage() {
  const navigate = useNavigate();

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await api.get("/sites/")).data,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/projects/")).data,
  });

  const projectMap = Object.fromEntries(
    projects.map((p) => [p.id, p.name])
  );

  return (
    <DashboardLayout>
      <div className="p-8 min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 space-y-8">
        <PageHeader
          title="Sites"
          subtitle="Manage construction sites and geofences"
          addLabel=""
        />

        {isLoading ? (
          <div className="text-slate-500">Loading...</div>
        ) : (
          <div className="space-y-6">
            {sites.map((site) => (
              <div
                key={site.id}
                onClick={() => navigate(`/sites/${site.id}`)}
                className="cursor-pointer backdrop-blur-xl bg-white/60
                           border border-white/40 shadow-xl rounded-3xl p-6
                           hover:scale-[1.02] hover:shadow-2xl
                           transition duration-300"
              >
                <div className="flex justify-between items-center">

                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      {site.name}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {projectMap[site.project_id] || "—"}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 text-xs rounded-full border ${
                      site.status === "active"
                        ? "bg-green-500/20 text-green-700 border-green-500/40"
                        : "bg-gray-500/20 text-gray-700 border-gray-500/40"
                    }`}
                  >
                    {site.status}
                  </span>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}