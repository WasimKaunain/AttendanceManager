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
        <p className="text-xs text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-lg font-semibold text-slate-800">
          {value}
        </p>
      </div>
    );
  }

  function StatCard({ title, value }) {
    return (
      <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl rounded-3xl p-6 text-center hover:scale-105 transition">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* HEADER */}
        <div className="relative text-center space-y-3">

          {/* ACTION BUTTONS */}
          <div className="absolute right-0 top-0 flex gap-3">

            <button
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-xl shadow-lg hover:scale-105 transition"
            >
              Edit
            </button>

            <button
              onClick={() => setStatusModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:scale-105 transition"
            >
              Change Status
            </button>

            {!project.is_deleted && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl shadow-lg hover:scale-105 transition"
              >
                Archive
              </button>
            )}

          </div>

          {/* PROJECT NAME */}
          <h1 className="text-4xl font-bold tracking-tight">
            {project.name}
          </h1>

          {/* STATUS */}
          <div className="flex justify-center items-center gap-3">
            <span
              className={`px-4 py-1 text-sm rounded-full border backdrop-blur-md ${statusColors[project.status]}`}
            >
              {project.status}
            </span>
          </div>

          {/* STATUS CHANGE BUTTONS */}
        </div>

        {/* INFO CARD */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-8 grid grid-cols-2 gap-6">
          <Info label="Project Code" value={project.code} />
          <Info label="Start Date" value={project.start_date || "N/A"} />
          <Info label="End Date" value={project.end_date || "N/A"} />
          <Info label="Total Sites" value={total_sites} />
          <Info label="Total Workers" value={total_workers} />
          <Info label="Client Name" value={project.client_name || "N/A"} />
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-6">
          <StatCard title="Sites" value={total_sites} />
          <StatCard title="Workers" value={total_workers} />
          <StatCard title="Attendance Records" value={total_attendance} />
        </div>

        {/* DESCRIPTION */}
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-8">
          <h3 className="text-lg font-semibold mb-3">Project Description</h3>
          <p className="text-slate-600 leading-relaxed">
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setStatusModalOpen(false);
            setSelectedStatus(null);
          }}
        >
          <div
            className="backdrop-blur-xl bg-white/70 border border-white/40 shadow-2xl rounded-3xl p-8 w-[450px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-6 text-center">
              Change Project Status
            </h2>
        
            {allowedTransitions[project.status].length === 0 ? (
              <>
                <div className="text-center text-red-600 font-medium mb-6">
                  This project is in <b>{project.status}</b> state and cannot be changed further.
                </div>
            
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setStatusModalOpen(false);
                      setSelectedStatus(null);
                    }}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {allowedTransitions[project.status].map((status) => (
                    <label
                      key={status}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border cursor-pointer transition
                        ${selectedStatus === status
                          ? "bg-indigo-500/20 border-indigo-400"
                          : "bg-white/40 border-white/40 hover:bg-white/60"
                        }`}
                    >
                      <span className="capitalize font-medium">{status}</span>
                      
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
                
                {/* ACTION BUTTONS */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setStatusModalOpen(false);
                      setSelectedStatus(null);
                    }}
                    className="px-4 py-2 border rounded-lg"
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
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
