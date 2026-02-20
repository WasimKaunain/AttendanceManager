import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import api from "@/core/api/axios";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    client_name: "",
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.get("/projects/");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await api.post("/projects/", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDialogOpen(false);
      setForm({
        name: "",
        code: "",
        description: "",
        client_name: "",
      });
    },
  });

  const statusColors = {
    active: "bg-green-500/20 text-green-700 border-green-500/40",
    completed: "bg-blue-500/20 text-blue-700 border-blue-500/40",
    terminated: "bg-red-500/20 text-red-700 border-red-500/40",
    inactive: "bg-gray-500/20 text-gray-700 border-gray-500/40",
    upcoming: "bg-purple-500/20 text-purple-700 border-purple-500/40",
  };

  return (
    <DashboardLayout>
      <div className="p-8 min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 space-y-8">
          <PageHeader
            title="Projects"
            subtitle="Manage and monitor construction projects"
            onAdd={() => setDialogOpen(true)}
            addLabel="New Project"
          />

        {/* PROJECT LIST */}
        {isLoading ? (
          <div className="text-slate-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-slate-400 text-center py-12">
            No projects found.
          </div>
        ) : (
          <div className="space-y-6">

            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="cursor-pointer
                           backdrop-blur-xl bg-white/60
                           border border-white/40
                           shadow-xl
                           rounded-3xl p-6
                           hover:scale-[1.02]
                           hover:shadow-2xl
                           transition duration-300"
              >
                <div className="flex justify-between items-center">

                  {/* LEFT SIDE */}
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-slate-800">
                      {project.name}
                    </h2>

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                        {project.code}
                      </span>

                      <span>
                        Client: {project.client_name || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* STATUS */}
                  <span
                    className={`px-4 py-1 text-sm rounded-full border backdrop-blur-md ${statusColors[project.status]}`}
                  >
                    {project.status}
                  </span>

                </div>
              </div>
            ))}

          </div>
        )}

      </div>

      {/* CREATE MODAL */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className="backdrop-blur-xl bg-white/80 border border-white/40
                       rounded-3xl w-96 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              Create New Project
            </h2>

            <div className="space-y-3">
              <input
                placeholder="Project Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full border rounded-xl p-2"
              />

              <input
                placeholder="Project Code"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value })
                }
                className="w-full border rounded-xl p-2"
              />

              <input
                placeholder="Client Name"
                value={form.client_name}
                onChange={(e) =>
                  setForm({ ...form, client_name: e.target.value })
                }
                className="w-full border rounded-xl p-2"
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border rounded-xl p-2"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDialogOpen(false)}
                className="text-slate-600"
              >
                Cancel
              </button>

              <button
                onClick={() => createMutation.mutate(form)}
                className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
