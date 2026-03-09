import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/core/api/axios";
import DashboardLayout from "@/layout/DashboardLayout";
import { ArrowLeft,Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import WorkerFormDialog from "./components/WorkerFormDialog";
import DangerousDialog from "@/modules/data_management/components/DangerousActionModal";


export default function WorkerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  // -------------------------
  // Fetch Worker
  // -------------------------
  const { data: worker } = useQuery({
    queryKey: ["worker", id],
    queryFn: async () => (await api.get(`/workers/${id}`)).data,
  });

  // ------------------
  // FETCH WORKET PHOTO
  //-------------------

  const { data: photoData } = useQuery({
  queryKey: ["worker-photo", id],
  queryFn: async () =>
    (await api.get(`/workers/${id}/photo`)).data,
  enabled: !!worker?.photo_url,
    });

  // -------------------------
  // Fetch Projects & Sites (for name mapping)
  // -------------------------
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/projects/")).data,
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await api.get("/sites/")).data,
  });

  const projectName =
    projects.find((p) => p.id === worker?.project_id)?.name || "—";

  const siteName =
    sites.find((s) => s.id === worker?.site_id)?.name || "—";

  // -------------------------
  // Attendance Summary
  // -------------------------
  const { data: summary } = useQuery({
    queryKey: ["attendance-summary", id],
    queryFn: async () =>
      (await api.get(`/workers/${id}/attendance-summary`)).data,
  });

    //-------------------------
  //PERFORMANCE STATS CALCULATION
  //-------------------------
  const totalDays = (summary?.present_days || 0) + (summary?.absent_days || 0) || 1;

  const attendancePercent = summary ? Math.min(100,((summary.present_days / totalDays) * 100).toFixed(0)): 0;

  const performanceScore = summary ? Math.min(100, (summary.total_hours / 200) * 100).toFixed(0): 0;
    
  const rating = (attendancePercent / 20).toFixed(1); // 0-5 scale


  const archiveMutation = useMutation({
    mutationFn: async (payload) =>
      api.patch(`/workers/${id}/archive`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["worker", id]);
      queryClient.invalidateQueries(["workers"]);
      navigate("/workers");
    },
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => api.patch(`/workers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["worker", id]);
      queryClient.invalidateQueries(["workers"]);
    },
    onError: () => {}, // ensures mutateAsync re-throws errors to the caller
  });


  // -------------------------
  // Toggle Status
  // -------------------------
const toggleMutation = useMutation({
  mutationFn: async () =>
    api.patch(`/workers/${id}`, {
      status: worker.status === "active" ? "inactive" : "active",
    }),
  onSuccess: () => {
    queryClient.invalidateQueries(["worker", id]);
  },
});

  if (!worker) return <DashboardLayout>Loading...</DashboardLayout>;

  const GlassCard = ({ children }) => (
    <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-6">
      {children}
    </div>
  );

  const InfoItem = ({ label, value }) => (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 bg-gradient-to-br from-slate-100 via-white to-slate-200 min-h-screen">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to Workers
        </button>

        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Profile Card */}
          <GlassCard>
            <div className="relative flex flex-col items-center text-center pt-32 pb-6 space-y-5">
            
              {/* Gradient Cover Header *
              <div className="absolute top-0 left-0 w-full h-28 rounded-t-3xl 
                bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 
                opacity-80 blur-[1px]" />
          
              {/* Profile Image */}
              <div className={`w-40 h-40 rounded-full object-cover border-[5px] border-white shadow-2xl 
                ${worker.status === "active" ? "active-glow" : ""}`}>
                {worker.photo_url ? (
                  <img
                    src={photoData?.url}
                    alt="profile"
                    className="w-40 h-40 rounded-full object-cover border-[5px] border-white shadow-2xl ring-4 ring-pink-400/40"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-slate-200 
                                  flex items-center justify-center 
                                  text-slate-500 shadow-inner border-4 border-white">
                    No Photo
                  </div>
                )}
              </div>
              
              {/* Name */}
              <h2 className="mt-4 text-2xl font-bold bg-gradient-to-r 
                             from-pink-500 via-purple-500 to-indigo-500 
                             bg-clip-text text-transparent">
                {worker.full_name}
              </h2>

              {/* ID */}
              <p className="text-slate-500 font-bold text-lg">{worker.id}</p>
              
              {/* Status Badge */}
              <div
                className={`mt-3 px-5 py-1 text-xs font-medium rounded-full 
                  backdrop-blur-md border transition-all
                  ${
                    worker.status === "active"
                      ? "bg-green-500/20 text-green-700 border-green-500/40"
                      : "bg-gray-500/20 text-gray-700 border-gray-500/40"
                  }`}
              >
                {worker.status.toUpperCase()}
              </div>
                
              {/* Fancy Toggle Switch */}
              <div
                onClick={() => toggleMutation.mutate()}
                className={`relative w-full h-12 rounded-full cursor-pointer
                  transition-all duration-500 shadow-inner overflow-hidden
                  ${
                    worker.status === "active"
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : "bg-gradient-to-r from-gray-400 to-gray-500"
                  }`}
              >

                {/* Sliding Circle */}
                <div
                  className={`absolute top-1 left-1 h-10 w-1/2 rounded-full 
                    bg-white shadow-xl transition-all duration-500 flex items-center justify-center
                    ${
                      worker.status === "active"
                        ? "translate-x-full"
                        : "translate-x-0"
                    }`}
                >
                  <span className="font-bold text-sm text-slate-700">
                    {worker.status === "active" ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                  
                {/* Background Labels */}
                <div className="absolute inset-0 flex items-center justify-between px-6 text-white font-bold text-sm">
                  <span>INACTIVE</span>
                  <span>ACTIVE</span>
                </div>
                  
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 w-full text-center">

              <div className="backdrop-blur-md bg-white/40 rounded-xl py-3">
                <p className="text-xs text-slate-500">Attendance</p>
                <p className="text-lg font-bold text-indigo-600">
                  {attendancePercent}%
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/40 rounded-xl py-3">
                <p className="text-xs text-slate-500">Rating</p>
                <p className="text-lg font-bold text-pink-600">
                  ⭐ {rating}
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/40 rounded-xl py-3">
                <p className="text-xs text-slate-500">Performance</p>
                <p className="text-lg font-bold text-emerald-600">
                  {performanceScore}%
                </p>
              </div>

            </div>

            {/* Action Buttons */}
              <div className="mt-6 flex gap-4 w-full">

                  {/* Edit Button */}
                    <button
                      onClick={() => setEditOpen(true)}
                      className="flex-1 backdrop-blur-md 
             bg-indigo-500/20 
             border border-indigo-400/40 
             text-indigo-700 
             rounded-xl py-3 font-semibold 
             shadow-xl hover:scale-105 
             transition-all duration-300
             flex items-center justify-center gap-2
             hover:bg-indigo-500/30"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                  {/* Delete Button */}
                    {!worker.is_deleted && (
                      <button
                        onClick={() => setDeleteOpen(true)}
                        className="flex-1 backdrop-blur-md bg-amber-500/20 
                                   border border-amber-400/40 
                                   text-amber-700 
                                   rounded-xl py-3 font-semibold 
                                   shadow-xl hover:scale-105 transition 
                                   flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Archive
                      </button>
                    )}
                  
              </div>  
            </div>
          </GlassCard>

          {/* Right Info Section */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tabs (unchanged) */}
            <div className="flex gap-6 border-b pb-2">
              {["overview", "attendance", "payroll"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`capitalize pb-1 ${
                    tab === t
                      ? "border-b-2 border-black font-medium"
                      : "text-slate-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {tab === "overview" && (
              <div className="space-y-6">

                {/* Identity Card */}
                <GlassCard>
                  <h3 className="font-semibold mb-4">Identity</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InfoItem label="Employee ID" value={worker.id} />
                    <InfoItem label="ID Number" value={worker.id_number} />
                    <InfoItem label="Joining Date" value={worker.joining_date} />
                    <InfoItem label="Mobile" value={worker.mobile} />
                  </div>
                </GlassCard>

                {/* Work Details */}
                <GlassCard>
                  <h3 className="font-semibold mb-4">Work Details</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InfoItem label="Project" value={projectName} />
                    <InfoItem label="Site" value={siteName} />
                    <InfoItem label="Role" value={worker.role} />
                    <InfoItem label="Type" value={worker.type} />
                  </div>
                </GlassCard>

                {/* Compensation */}
                <GlassCard>
                  <h3 className="font-semibold mb-4">Compensation</h3>

                  <div className="grid grid-cols-2 gap-6">

                    {worker.type === "permanent" && (
                      <>
                        <InfoItem
                          label="Monthly Salary"
                          value={`₹ ${worker.monthly_salary || 0}`}
                        />
                        <InfoItem
                          label="Daily Rate"
                          value={`₹ ${worker.daily_rate || 0}`}
                        />
                      </>
                    )}

                    {worker.type === "contract" && (
                      <>
                        <InfoItem
                          label="Hourly Rate"
                          value={`₹ ${worker.hourly_rate || 0}`}
                        />
                        <InfoItem
                          label="Daily Rate"
                          value={`₹ ${worker.daily_rate || 0}`}
                        />
                      </>
                    )}

                  </div>
                </GlassCard>

                {/* Attendance Summary at Bottom */}
                {summary && (
                  <GlassCard>
                    <h3 className="font-semibold mb-4">
                      Attendance Summary
                    </h3>

                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <p className="text-sm text-slate-500">
                          Present Days
                        </p>
                        <p className="text-2xl font-bold">
                          {summary.present_days}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Absent Days
                        </p>
                        <p className="text-2xl font-bold">
                          {summary.absent_days}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Total Hours
                        </p>
                        <p className="text-2xl font-bold">
                          {summary.total_hours || 0}
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                )}

              </div>
            )}

          </div>
        </div>
      </div>

       {/* Edit Worker Dialog */}
    <WorkerFormDialog
      open={editOpen}
      initialData={worker}
      onClose={() => setEditOpen(false)}
      projects={projects}
      sites={sites}
      onSubmit={async (data) => {
        try {
          await updateMutation.mutateAsync({ id: worker.id, data });
        } catch (err) {
          throw err; // re-throw so WorkerFormDialog's catch block receives it
        }
      }}
    />

    <DangerousDialog
      open={deleteOpen}
      title="Archive Worker"
      description="Archiving this worker will deactivate them but preserve attendance records."
      confirmLabel="Archive"
      confirmColor="amber"
      entityName={worker?.full_name}
      onClose={() => setDeleteOpen(false)}
      onConfirm={(payload) => {
        archiveMutation.mutate(payload);
        setDeleteOpen(false);
      }}
    />
    </DashboardLayout>
  );
}
