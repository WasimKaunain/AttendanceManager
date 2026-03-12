import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import api from "@/core/api/axios";
import DashboardLayout from "@/layout/DashboardLayout";
import DangerousDialog from "@/modules/data_management/components/DangerousActionModal";
import ProjectFormDialog from "./components/ProjectFormDialog";

export default function ProjectProfilePage() {

  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // ---------------- STATUS COLORS ----------------
  const statusColors = {
    active: "bg-green-500/20 text-green-700 border-green-500/40",
    completed: "bg-blue-500/20 text-blue-700 border-blue-500/40",
    terminated: "bg-red-500/20 text-red-700 border-red-500/40",
    inactive: "bg-gray-500/20 text-gray-700 border-gray-500/40",
    upcoming: "bg-purple-500/20 text-purple-700 border-purple-500/40",
  };

  const allowedTransitions = {
  active: ["inactive", "terminated", "completed"],
  inactive: ["active", "terminated"],
  upcoming: ["active", "terminated"],
  completed: [],
  terminated: [],
};


  // ---------------- FETCH PROJECT ----------------
  const { data, isLoading } = useQuery({
    queryKey: ["project-summary", id],
    queryFn: async () =>
      (await api.get(`/projects/${id}/summary`)).data,
  });

  // ---------------- LOCAL STATES ----------------
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (data?.project) {
      setForm(data.project);
    }
  }, [data]);

  // ---------------- STATUS UPDATE ----------------
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      return await api.put(`/projects/${id}/status`, null, {
        params: { status: newStatus },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  // ---------------- PROJECT UPDATE ----------------
  const updateProjectMutation = useMutation({
    mutationFn: async (data) => api.put(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => {},
  });

  // ---------------- DELETE PROJECT ----------------
  const archiveMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.patch(`/projects/${id}/archive`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-summary", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading...</div>
      </DashboardLayout>
    );
  }

  const { project, total_sites, total_workers, total_attendance } = data;

  // ---------------- SMALL UI COMPONENTS ----------------
  function Info({ label, value }) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100">
          {value}
        </p>
      </div>
    );
  }

  function StatCard({ title, value }) {
    return (
      <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 shadow-xl rounded-3xl p-4 md:p-6 text-center hover:scale-105 transition">
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl md:text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-5 md:space-y-8">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* HEADER — stacks on mobile, centered title with buttons below */}
        <div className="space-y-3">
          {/* PROJECT NAME */}
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-slate-800 dark:text-white text-center">
            {project.name}
          </h1>

          {/* STATUS BADGE */}
          <div className="flex justify-center">
            <span className={`px-4 py-1 text-sm rounded-full border backdrop-blur-md ${statusColors[project.status]}`}>
              {project.status}
            </span>
          </div>

          {/* ACTION BUTTONS — wraps naturally on mobile */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            <button
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-lg hover:scale-105 transition"
            >
              Edit
            </button>

            <button
              onClick={() => setStatusModalOpen(true)}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 transition"
            >
              Change Status
            </button>

            {!project.is_deleted && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="px-4 py-2 text-sm bg-amber-500 text-white rounded-xl shadow-lg hover:scale-105 transition"
              >
                Archive
              </button>
            )}
          </div>
        </div>

        {/* INFO CARD — 1 col on mobile, 2 on md+ */}
        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 shadow-2xl rounded-3xl p-5 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Info label="Project Code" value={project.code} />
          <Info label="Start Date" value={project.start_date || "N/A"} />
          <Info label="End Date" value={project.end_date || "N/A"} />
          <Info label="Total Sites" value={total_sites} />
          <Info label="Total Workers" value={total_workers} />
          <Info label="Client Name" value={project.client_name || "N/A"} />
        </div>

        {/* STATS — 1 col on mobile, 3 on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
          <StatCard title="Sites" value={total_sites} />
          <StatCard title="Workers" value={total_workers} />
          <StatCard title="Attendance Records" value={total_attendance} />
        </div>

        {/* DESCRIPTION */}
        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 shadow-2xl rounded-3xl p-5 md:p-8">
          <h3 className="text-base md:text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">Project Description</h3>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {project.description || "No description provided."}
          </p>
        </div>

      </div>

      {/* ---------------- EDIT MODAL ---------------- */}
      <ProjectFormDialog
        open={editOpen}
        initialData={form}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => {
          try {
            await updateProjectMutation.mutateAsync(data);
          } catch (err) {
            throw err;
          }
        }}
      />

      <DangerousDialog
        open={deleteOpen}
        title="Archive Project"
        description="Archiving this project will deactivate all linked sites and workers."
        confirmLabel="Archive"
        confirmColor="amber"
        entityName={project.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={(payload) => {
          archiveMutation.mutate(payload);
          setDeleteOpen(false);
        }}
      />


      {statusModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => {
            setStatusModalOpen(false);
            setSelectedStatus(null);
          }}
        >
          <div
            className="backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/40 dark:border-slate-700/40 shadow-2xl rounded-3xl p-6 md:p-8 w-full sm:w-[450px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base md:text-lg font-semibold mb-6 text-center text-slate-800 dark:text-slate-100">
              Change Project Status
            </h2>
        
            {allowedTransitions[project.status].length === 0 ? (
              <>
                <div className="text-center text-red-600 dark:text-red-400 font-medium mb-6">
                  This project is in <b>{project.status}</b> state and cannot be changed further.
                </div>
            
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setStatusModalOpen(false);
                      setSelectedStatus(null);
                    }}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {allowedTransitions[project.status].map((status) => (
                    <label
                      key={status}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border cursor-pointer transition
                        ${selectedStatus === status
                          ? "bg-indigo-500/20 border-indigo-400"
                          : "bg-white/40 dark:bg-slate-700/40 border-white/40 dark:border-slate-600/40 hover:bg-white/60 dark:hover:bg-slate-700/60"
                        }`}
                    >
                      <span className="capitalize font-medium text-slate-800 dark:text-slate-100 text-sm">{status}</span>
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={selectedStatus === status}
                        onChange={() => setSelectedStatus(status)}
                        className="w-4 h-4 accent-indigo-600"
                      />
                    </label>
                  ))}
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setStatusModalOpen(false);
                      setSelectedStatus(null);
                    }}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={() => {
                      if (!selectedStatus) {
                        alert("Please select a status.");
                        return;
                      }
                      updateStatusMutation.mutate(selectedStatus);
                      setStatusModalOpen(false);
                      setSelectedStatus(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                  >
                    Confirm Change
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
