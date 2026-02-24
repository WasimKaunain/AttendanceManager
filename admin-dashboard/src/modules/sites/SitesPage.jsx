import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/core/api/axios";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import SiteFormDialog from "./components/SiteFormDialog";

export default function SitesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);

  // ================= FETCH SITES =================
  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await api.get("/sites/")).data,
  });

  // ================= FETCH PROJECTS (for dropdown) =================
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/projects/")).data,
  });

  const projectMap = Object.fromEntries(
    projects.map((p) => [p.id, p.name])
  );

  // ================= CREATE SITE =================
  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post("/sites/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setDialogOpen(false);
    },
  });

  const statusColors = {
    active: "bg-green-500/20 text-green-700 border-green-500/40",
    inactive: "bg-gray-500/20 text-gray-700 border-gray-500/40",
  };

  return (
    <DashboardLayout>
      <div className="p-8 min-h-screen space-y-8">

        {/* HEADER */}
        <PageHeader
          title="Sites"
          subtitle="Manage construction sites and geofences"
          onAdd={() => setDialogOpen(true)}
          addLabel="Create Site"
        />

        {/* SITE LIST */}
        {isLoading ? (
          <div className="text-slate-500">Loading sites...</div>
        ) : sites.length === 0 ? (
          <div className="text-slate-400 text-center py-12">
            No sites found.
          </div>
        ) : (
          <div className="space-y-6">
            {sites.map((site) => (
              <div
                key={site.id}
                onClick={() => navigate(`/sites/${site.id}`)}
                className="cursor-pointer backdrop-blur-xl bg-white/60
                           border border-white/40 shadow-xl
                           rounded-3xl p-6 hover:scale-[1.02]
                           hover:shadow-2xl transition duration-300"
              >
                <div className="flex justify-between items-center">

                  {/* LEFT */}
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-slate-800">
                      {site.name}
                    </h2>

                    <div className="text-sm text-slate-500">
                      Project: {projectMap[site.project_id] || "—"}
                    </div>

                    <div className="text-xs text-slate-400">
                      Radius: {site.geofence_radius} m
                    </div>
                  </div>

                  {/* STATUS */}
                  <span
                    className={`px-4 py-1 text-sm rounded-full border backdrop-blur-md ${statusColors[site.status]}`}
                  >
                    {site.status}
                  </span>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE SITE DIALOG */}
      <SiteFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={(form) => createMutation.mutate(form)}
        projects={projects}
        isSubmitting={createMutation.isPending}
      />
    </DashboardLayout>
  );
}