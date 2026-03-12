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
    },
    onError: () => {}, // ensures mutateAsync re-throws errors to the caller
  });

  const statusColors = {
    active: "bg-green-500/20 text-green-700 border-green-500/40 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30",
    inactive: "bg-gray-500/20 text-gray-600 border-gray-500/40 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600/40",
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 min-h-screen space-y-4 md:space-y-6">

        {/* HEADER */}
        <PageHeader
          title="Sites"
          subtitle="Manage construction sites and geofences"
          onAdd={() => setDialogOpen(true)}
          addLabel="Create Site"
        />

        {/* SITE LIST */}
        {isLoading ? (
          <div className="text-slate-500 dark:text-slate-400">Loading sites...</div>
        ) : sites.length === 0 ? (
          <div className="text-slate-400 dark:text-slate-500 text-center py-16">
            No sites found.
          </div>
        ) : (
          <div className="space-y-2">
            {sites.map((site) => (
              <div
                key={site.id}
                onClick={() => navigate(`/sites/${site.id}`)}
                className="glass-row"
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="row-title truncate">{site.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="row-sub">{projectMap[site.project_id] || "No project"}</span>
                      <span className="row-meta hidden sm:inline">· {site.geofence_radius} m radius</span>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-0.5 text-xs rounded-full border backdrop-blur-md ${statusColors[site.status] || statusColors.inactive}`}>
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
        onSubmit={async (form) => {
          try {
            await createMutation.mutateAsync(form);
          } catch (err) {
            throw err;
          }
        }}
        projects={projects}
        isSubmitting={createMutation.isPending}
      />
    </DashboardLayout>
  );
}