import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/core/api/axios";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import ProjectFormDialog from "./components/ProjectFormDialog";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/projects/")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => api.post("/projects/", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    onError: () => {},
  });

  const statusColors = {
    active: "bg-green-500/20 text-green-700 border-green-500/40 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30",
    completed: "bg-blue-500/20 text-blue-700 border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30",
    terminated: "bg-red-500/20 text-red-700 border-red-500/40 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30",
    inactive: "bg-gray-500/20 text-gray-600 border-gray-500/40 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600/40",
    upcoming: "bg-purple-500/20 text-purple-700 border-purple-500/40 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30",
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 min-h-screen space-y-4 md:space-y-6">
        <PageHeader
          title="Projects"
          subtitle="Manage and monitor construction projects"
          onAdd={() => setDialogOpen(true)}
          addLabel="New Project"
        />

        {isLoading ? (
          <div className="text-slate-500 dark:text-slate-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-slate-400 dark:text-slate-500 text-center py-16">No projects found.</div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="glass-row"
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="row-title truncate">{project.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="row-meta font-mono bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">{project.code}</span>
                      <span className="row-sub">{project.client_name || "No client"}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2.5 py-0.5 text-xs rounded-full border backdrop-blur-md ${statusColors[project.status] || statusColors.inactive}`}>
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={async (data) => {
          try {
            await createMutation.mutateAsync(data);
          } catch (err) {
            throw err;
          }
        }}
      />
    </DashboardLayout>
  );
}
