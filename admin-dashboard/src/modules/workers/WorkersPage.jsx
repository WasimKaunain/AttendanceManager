import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/Card";
import DataTable from "@/shared/components/DataTable";
import { Trash2, Pencil } from "lucide-react";


import { useWorkers } from "./hooks";
import WorkerFormDialog from "./components/WorkerFormDialog";
import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axios";

export default function WorkersPage() {
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editingWorker, setEditingWorker] = useState(null);


  const {
    workersQuery,
    createMutation,
    deleteMutation,
  } = useWorkers();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/projects/")).data,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await api.get("/sites/")).data,
  });

  // -------------------------
  // Mapping
  // -------------------------
  const projectMap = Object.fromEntries(
    projects.map((p) => [p.id, p.name])
  );

  const siteMap = Object.fromEntries(
    sites.map((s) => [s.id, s.name])
  );

  // -------------------------
  // Filtering Logic
  // -------------------------
  const filteredWorkers = useMemo(() => {
    const workers = workersQuery.data || [];

    return workers.filter((w) => {
      const matchesSearch =
        w.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        w.mobile?.includes(search);

      const matchesProject = filterProject
        ? w.project_id === filterProject
        : true;

      const matchesSite = filterSite
        ? w.site_id === filterSite
        : true;

      const matchesStatus = filterStatus
        ? w.status === filterStatus
        : true;

      return (
        matchesSearch &&
        matchesProject &&
        matchesSite &&
        matchesStatus
      );
    });
  }, [workersQuery.data, search, filterProject, filterSite, filterStatus]);

  // -------------------------
  // Columns
  // -------------------------
  const columns = [
    {
      key: "full_name",
      label: "Name",
      render: (r) => (
        <span
          className="cursor-pointer font-medium text-slate-800 hover:underline"
          onClick={() => navigate(`/workers/${r.id}`)}
        >
          {r.full_name}
        </span>
      ),
    },
    { key: "mobile", label: "Mobile" },

    {
      key: "project",
      label: "Project",
      render: (r) => projectMap[r.project_id] || "-",
    },
    {
      key: "site",
      label: "Site",
      render: (r) => siteMap[r.site_id] || "-",
    },

    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span
          className={`px-2 py-1 text-xs rounded-md ${
            r.status === "active"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {r.status}
        </span>
      ),
    },
    ];

  // -------------------------
  // UI
  // -------------------------
  return (
    <DashboardLayout>
      <div className="p-8 min-h-screen space-y-8">
      <PageHeader
        title="Workers"
        subtitle="Manage workforce and face enrollment"
        onAdd={() => setDialogOpen(true)}
        addLabel="New Worker"
      />

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          placeholder="Search worker..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-64"
        />

        <select
          value={filterProject}
          onChange={(e) => {
            setFilterProject(e.target.value);
            setFilterSite("");
          }}
          className="border rounded px-3 py-2"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Sites</option>
          {sites
            .filter((s) =>
              filterProject ? s.project_id === filterProject : true
            )
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

            <div className="space-y-6">
                      
              {filteredWorkers.map((w) => (
                <div
                  key={w.id}
                  onClick={() => navigate(`/workers/${w.id}`)}
                  className="cursor-pointer backdrop-blur-xl bg-white/60 
                             border border-white/40 
                             shadow-xl rounded-3xl p-6 
                             hover:scale-[1.02] hover:shadow-2xl 
                             transition duration-300"
                >
                  <div className="flex justify-between items-center">
              
                    {/* LEFT SIDE */}
                    <div>
            
                      <div>
                        <h2 className="text-lg font-bold text-slate-800">
                          {w.full_name}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {w.mobile}
                        </p>
                      </div>
                    
                    </div>
                    
                    {/* RIGHT SIDE */}
                    <div className="text-right">
                    
                      <p className="text-sm text-slate-600">
                        {projectMap[w.project_id] || "-"}
                      </p>
                    
                      <span
                        className={`mt-2 inline-block px-3 py-1 text-xs rounded-full border backdrop-blur-md
                          ${
                            w.status === "active"
                              ? "bg-green-500/20 text-green-700 border-green-500/40"
                              : "bg-gray-500/20 text-gray-700 border-gray-500/40"
                          }`}
                      >
                        {w.status}
                      </span>
                        
                    </div>
                        
                  </div>
                </div>
              ))}
            
            </div>


      <WorkerFormDialog
        open={dialogOpen}
        initialData={editingWorker}
        onClose={() => {
          setDialogOpen(false);
          setEditingWorker(null);
        }}
        projects={projects}
        sites={sites}
        onSubmit={async (data) => {
          try {
            await createMutation.mutateAsync(data);
          } catch (err) {
            throw err; // re-throw so WorkerFormDialog's catch block receives it
          }
        }}
      />
    </div>
    </DashboardLayout>
  );
}
