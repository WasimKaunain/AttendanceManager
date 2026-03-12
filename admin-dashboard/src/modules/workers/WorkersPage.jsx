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
      <div className="p-4 md:p-6 min-h-screen space-y-4 md:space-y-6">
      <PageHeader
        title="Workers"
        subtitle="Manage workforce and face enrollment"
        onAdd={() => setDialogOpen(true)}
        addLabel="New Worker"
      />

      {/* FILTER BAR — wraps naturally on mobile */}
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Search worker..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input w-full sm:w-56"
        />
        <select
          value={filterProject}
          onChange={(e) => { setFilterProject(e.target.value); setFilterSite(""); }}
          className="filter-input"
        >
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
          className="filter-input"
        >
          <option value="">All Sites</option>
          {sites.filter((s) => filterProject ? s.project_id === filterProject : true)
            .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-input"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="space-y-2">
        {filteredWorkers.map((w) => (
          <div
            key={w.id}
            onClick={() => navigate(`/workers/${w.id}`)}
            className="glass-row"
          >
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                  <p className="row-title truncate">{w.full_name}</p>
                  <p className="row-sub">{w.mobile}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <p className="row-sub hidden sm:block">{projectMap[w.project_id] || "—"}</p>
                <p className="row-sub hidden md:block">{siteMap[w.site_id] || "—"}</p>
                <span className={`px-2.5 py-0.5 text-xs rounded-full border backdrop-blur-md
                  ${w.status === "active"
                    ? "bg-green-500/20 text-green-700 border-green-500/40 dark:bg-green-500/10 dark:text-green-400"
                    : "bg-gray-500/20 text-gray-600 border-gray-400/40 dark:bg-slate-700/50 dark:text-slate-400"}`}>
                  {w.status}
                </span>
              </div>
            </div>
          </div>
        ))}
        {filteredWorkers.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">No workers found.</div>
        )}
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
