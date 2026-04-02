import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/core/api/axios";
import DashboardLayout from "@/layout/DashboardLayout";
import { ArrowLeft, Trash2, Pencil, Plus, Download, Trash, FileImage, FolderOpen, Upload, X, Clock, TrendingUp, Zap, CheckCircle2, Timer, Flame, Wallet, CreditCard, CircleMinus, Gift, BadgeDollarSign, CalendarDays } from "lucide-react";
import { useState, useRef } from "react";
import WorkerFormDialog from "./components/WorkerFormDialog";
import DangerousDialog from "@/modules/data_management/components/DangerousActionModal";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";


export default function WorkerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assetDeleteKey, setAssetDeleteKey] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const fileInputRef = useRef(null);

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

  // -------------------------
  // Attendance Insight (for Attendance tab)
  // -------------------------
  const [heatmapDate, setHeatmapDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const { data: insight, isLoading: insightLoading } = useQuery({
    queryKey: ["attendance-insight", id, heatmapDate.year, heatmapDate.month],
    queryFn: async () =>
      (await api.get(`/workers/${id}/attendance-insight`, {
        params: { year: heatmapDate.year, month: heatmapDate.month },
      })).data,
      enabled: tab === "attendance",
  });

  const shiftHeatmapMonth = (delta) => {
    setHeatmapDate((prev) => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 12) { m = 1;  y++; }
      if (m < 1)  { m = 12; y--; }
      return { year: y, month: m };
    });
  };

  // -------------------------
  // Payroll
  // -------------------------
  const [payrollDate, setPayrollDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const { data: payroll, isLoading: payrollLoading, refetch: refetchPayroll } = useQuery({
    queryKey: ["payroll", id, payrollDate.year, payrollDate.month],
    queryFn: async () =>
      (await api.get(`/workers/${id}/payroll`, {
        params: { year: payrollDate.year, month: payrollDate.month },
      })).data,
    enabled: tab === "payroll",
  });

  const shiftPayrollMonth = (delta) => {
    setPayrollDate((prev) => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 12) { m = 1; y++; }
      if (m < 1)  { m = 12; y--; }
      return { year: y, month: m };
    });
  };

  // Add Entry modal state
  const [entryModal, setEntryModal]   = useState(false);
  const [entryForm, setEntryForm]     = useState({ entry_type: "advance", amount: "", date: new Date().toISOString().slice(0, 10), note: "" });
  const [entrySubmitting, setEntrySubmitting] = useState(false);

  const handleAddEntry = async () => {
    if (!entryForm.amount || isNaN(Number(entryForm.amount)) || Number(entryForm.amount) <= 0) return;
    setEntrySubmitting(true);
    try {
      await api.post(`/workers/${id}/payroll/entries`, {
        ...entryForm,
        amount: Number(entryForm.amount),
        year:  payrollDate.year,
        month: payrollDate.month,
      });
      setEntryModal(false);
      setEntryForm({ entry_type: "advance", amount: "", date: new Date().toISOString().slice(0, 10), note: "" });
      refetchPayroll();
    } catch (err) {
      console.error("Failed to add entry", err);
    } finally {
      setEntrySubmitting(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await api.delete(`/workers/${id}/payroll/entries/${entryId}`);
      refetchPayroll();
    } catch (err) {
      console.error("Failed to delete entry", err);
    }
  };

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

  // -------------------------
  // Worker Assets
  // -------------------------
  const {data: assetsData,isLoading: assetsLoading,refetch: refetchAssets,} = useQuery({
    queryKey: ["worker-assets", id],
    queryFn: async () => (await api.get(`/workers/${id}/assets`)).data,
    enabled: tab === "assets",
    staleTime: 0,
  });

  const handleAssetUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post(`/workers/${id}/assets`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      refetchAssets();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAssetDelete = async (key) => {
    try {
      await api.delete(`/workers/${id}/assets`, { params: { key } });
      refetchAssets();
    } catch (err) {
      console.error("Delete failed", err);
    }
    setAssetDeleteKey(null);
  };

  const handleAssetDownload = (file) => {
    const a = document.createElement("a");
    a.href = file.download_url;
    a.download = file.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!worker) return <DashboardLayout>Loading...</DashboardLayout>;

  const GlassCard = ({ children }) => (
    <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/50 shadow-2xl dark:shadow-slate-900/60 rounded-3xl p-6">
      {children}
    </div>
  );

  const InfoItem = ({ label, value }) => (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-5 md:space-y-8 min-h-screen">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Workers
        </button>

        {/* Top Section — stacked on mobile, side-by-side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">

          {/* Left Profile Card */}
          <GlassCard>
            <div className="relative flex flex-col items-center text-center pt-32 pb-6 space-y-5">
            
              {/* Gradient Cover Header *
              <div className="absolute top-0 left-0 w-full h-28 rounded-t-3xl 
                bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 
                opacity-80 blur-[1px]" />
          
              {/* Profile Image */}
              <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-[5px] border-white shadow-2xl 
                ${worker.status === "active" ? "active-glow" : ""}`}>
                {worker.photo_url ? (
                  <img
                    src={photoData?.url}
                    alt="profile"
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-[5px] border-white shadow-2xl ring-4 ring-pink-400/40"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-200 
                                  flex items-center justify-center 
                                  text-slate-500 shadow-inner border-4 border-white text-sm">
                    No Photo
                  </div>
                )}
              </div>
              
              {/* Name */}
              <h2 className="mt-4 text-xl md:text-2xl font-bold bg-gradient-to-r 
                             from-pink-500 via-purple-500 to-indigo-500 
                             bg-clip-text text-transparent">
                {worker.full_name}
              </h2>

              {/* ID */}
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm md:text-base break-all">{worker.id}</p>
              
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

              <div className="backdrop-blur-md bg-white/40 dark:bg-slate-700/40 rounded-xl py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Attendance</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {attendancePercent}%
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/40 dark:bg-slate-700/40 rounded-xl py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Rating</p>
                <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                  ⭐ {rating}
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/40 dark:bg-slate-700/40 rounded-xl py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Performance</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
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
          <div className="lg:col-span-2 space-y-4 md:space-y-6">

            {/* Tabs — scrollable on mobile */}
            <div className="flex gap-4 md:gap-6 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
              {[
                { key: "overview",    label: "Overview"    },
                { key: "attendance",  label: "Analytics"   },
                { key: "assets",      label: "Assets"      },
                { key: "payroll",     label: "Payroll"     },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`capitalize pb-1 whitespace-nowrap text-sm md:text-base transition-colors ${
                    tab === t.key
                      ? "border-b-2 border-black dark:border-white font-medium text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {tab === "overview" && (
              <div className="space-y-6">

                {/* Identity Card */}
                <GlassCard>
                  <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">Identity</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <InfoItem label="Employee ID" value={worker.id} />
                    <InfoItem label="ID Number" value={worker.id_number} />
                    <InfoItem label="Joining Date" value={worker.joining_date} />
                    <InfoItem label="Mobile" value={worker.mobile} />
                  </div>
                </GlassCard>

                {/* Work Details */}
                <GlassCard>
                  <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">Work Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <InfoItem label="Project" value={projectName} />
                    <InfoItem label="Site" value={siteName} />
                    <InfoItem label="Role" value={worker.role} />
                    <InfoItem label="Type" value={worker.type} />
                  </div>
                </GlassCard>

                {/* Compensation */}
                <GlassCard>
                  <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">Compensation</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">

                    <InfoItem
                      label="Monthly Salary"
                      value={worker.type === "contract" ? "N/A" : `₹ ${worker.monthly_salary != null ? worker.monthly_salary.toLocaleString() : 0}`}
                    />

                    <InfoItem
                      label="Hourly Rate"
                      value={worker.hourly_rate != null ? `₹ ${worker.hourly_rate}` : '—'}
                    />

                    <InfoItem
                      label="Daily Rate"
                      value={worker.daily_rate != null ? `₹ ${worker.daily_rate}` : '—'}
                    />

                    <InfoItem
                      label="Daily Working Hours"
                      value={worker.daily_working_hours != null ? worker.daily_working_hours : '—'}
                    />

                    <InfoItem
                      label="OT Multiplier"
                      value={worker.ot_multiplier != null ? worker.ot_multiplier : '—'}
                    />

                  </div>
                </GlassCard>

              </div>
            )}

            {/* Attendance Tab */}
            {tab === "attendance" && (
              <div className="space-y-5">
                {insightLoading || !insight ? (
                  <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>
                ) : (
                  <>
                    {/* ── Stat Pills ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { icon: <CheckCircle2 size={18} />, label: "Present Days",   value: insight.stat_pills.total_present,        color: "text-emerald-600", bg: "bg-emerald-50" },
                        { icon: <Clock size={18} />,        label: "Total Hours",    value: `${insight.stat_pills.total_hours}h`,    color: "text-indigo-600",  bg: "bg-indigo-50"  },
                        { icon: <TrendingUp size={18} />,   label: "Avg / Day",      value: `${insight.stat_pills.avg_daily_hrs}h`,  color: "text-blue-600",    bg: "bg-blue-50"    },
                        { icon: <Timer size={18} />,        label: "Avg Check-In",   value: insight.stat_pills.avg_checkin  || "—",  color: "text-violet-600",  bg: "bg-violet-50"  },
                        { icon: <Timer size={18} />,        label: "Avg Check-Out",  value: insight.stat_pills.avg_checkout || "—",  color: "text-pink-600",    bg: "bg-pink-50"    },
                        { icon: <Flame size={18} />,        label: "Streak",         value: `${insight.stat_pills.current_streak}d`, color: "text-rose-600",    bg: "bg-rose-50"    },
                        { icon: <Zap size={18} />,          label: "Best Streak",    value: `${insight.stat_pills.longest_streak}d`, color: "text-teal-600",    bg: "bg-teal-50"    },
                      ].map((pill) => (
                        <div key={pill.label}
                          className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-4 shadow-md flex items-center gap-3">
                          <div className={`${pill.bg} ${pill.color} p-2 rounded-xl`}>{pill.icon}</div>
                          <div>
                            <p className="text-xs text-slate-400">{pill.label}</p>
                            <p className={`text-lg font-bold ${pill.color}`}>{pill.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── 6-Month Trend Bar Chart ── */}
                    <GlassCard>
                      <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-500" />
                        Hours Worked — Last 6 Months
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={insight.monthly_trend} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="h" />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                            formatter={(v) => [`${v}h`, "Hours"]}
                          />
                          <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                            {insight.monthly_trend.map((_, i) => (
                              <Cell key={i} fill={i === insight.monthly_trend.length - 1 ? "#6366f1" : "#c7d2fe"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </GlassCard>

                    {/* ── Monthly Heatmap Calendar ── */}
                    <GlassCard>
                      {/* Header row with month nav + legend */}
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => shiftHeatmapMonth(-1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
                          >‹</button>
                          <h3 className="font-semibold text-slate-700 text-sm min-w-[110px] text-center">
                            {insight.heatmap_label}
                          </h3>
                          <button
                            onClick={() => shiftHeatmapMonth(1)}
                            disabled={
                              heatmapDate.year === new Date().getFullYear() &&
                              heatmapDate.month === new Date().getMonth() + 1
                            }
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >›</button>
                        </div>
                        <div className="flex gap-3 text-xs text-slate-500">
                          {[
                            { color: "bg-emerald-400", label: "Present" },
                            { color: "bg-slate-200",   label: "Absent"  },
                            { color: "bg-slate-50 border border-slate-200", label: "Future" },
                          ].map((l) => (
                            <div key={l.label} className="flex items-center gap-1">
                              <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                              {l.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Day-of-week headers */}
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                          <div key={d} className="text-center text-[10px] text-slate-400 font-semibold">{d}</div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* blank cells to align first day */}
                        {Array.from({ length: new Date(insight.heatmap[0].date).getDay() }).map((_, i) => (
                          <div key={`b-${i}`} />
                        ))}
                        {insight.heatmap.map((day) => (
                          <div
                            key={day.date}
                            title={`${day.date} — ${day.status}`}
                            className={`
                              h-7 w-full rounded-md flex items-center justify-center
                              text-[11px] font-semibold cursor-default
                              transition-transform hover:scale-110
                              ${day.status === "present" ? "bg-emerald-400 text-white" :
                                day.status === "late"    ? "bg-amber-400 text-white"   :
                                day.status === "future"  ? "bg-slate-50 text-slate-300 border border-slate-100" :
                                                           "bg-slate-100 text-slate-400"}
                            `}
                          >
                            {day.day}
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </>
                )}
              </div>
            )}

            {/* Assets Tab */}
            {tab === "assets" && (
              <div className="space-y-4">

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAssetUpload}
                />

                {/* Header card with title + upload button */}
                <GlassCard>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">Worker Assets</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Files stored in this worker's Assets folder (face enrollment, documents, etc.)
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Upload file"
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                        ${uploading
                          ? "bg-slate-200 cursor-not-allowed"
                          : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-110 hover:shadow-indigo-300 cursor-pointer"
                        }`}
                    >
                      {uploading ? (
                        <Upload size={20} className="text-slate-400 animate-bounce" />
                      ) : (
                        <Plus size={22} className="text-white" />
                      )}
                    </button>
                  </div>
                </GlassCard>

                {/* Files grid */}
                {assetsLoading || !assetsData ? (
                  <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                    Loading assets…
                  </div>
                ) : assetsData.files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                      <FolderOpen size={36} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">No files in Assets folder</p>
                    <p className="text-xs text-slate-400">Click the <strong>+</strong> button above to upload files</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {assetsData.files.map((file) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file.name);
                      return (
                        <div
                          key={file.key}
                          className="group relative backdrop-blur-xl bg-white/60 border border-white/40
                                     rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300
                                     flex flex-col items-center gap-3"
                        >
                          {/* File icon / image preview */}
                          <div
                            onClick={() => isImage && setPreviewAsset(file)}
                            className={`w-full h-28 rounded-xl flex items-center justify-center overflow-hidden
                              ${isImage ? "cursor-pointer" : ""}`}
                          >
                            {isImage ? (
                              <img
                                src={file.download_url}
                                alt={file.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <div className="bg-indigo-50 w-full h-full rounded-xl flex items-center justify-center">
                                <FileImage size={40} className="text-indigo-300" />
                              </div>
                            )}
                          </div>

                          {/* File info */}
                          <div className="w-full text-center">
                            <p className="text-xs font-medium text-slate-700 truncate w-full" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>

                          {/* Action buttons — appear on hover */}
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => handleAssetDownload(file)}
                              title="Download"
                              className="flex-1 flex items-center justify-center gap-1.5
                                         bg-indigo-500/10 border border-indigo-400/30
                                         text-indigo-600 text-xs font-medium
                                         rounded-xl py-2 hover:bg-indigo-500/20
                                         transition-all duration-200"
                            >
                              <Download size={13} />
                              Download
                            </button>
                            <button
                              onClick={() => setAssetDeleteKey(file.key)}
                              title="Delete"
                              className="flex items-center justify-center
                                         w-9 h-9 rounded-xl
                                         bg-red-500/10 border border-red-400/30
                                         text-red-500 hover:bg-red-500/20
                                         transition-all duration-200"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* ── Payroll Tab ── */}
            {tab === "payroll" && (
              <div className="space-y-5">
                {payrollLoading || !payroll ? (
                  <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading…</div>
                ) : (
                  <>
                    {/* Month navigation header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => shiftPayrollMonth(-1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition">‹</button>
                        <span className="font-semibold text-slate-700 min-w-[120px] text-center">{payroll.month_label}</span>
                        <button onClick={() => shiftPayrollMonth(1)}
                          disabled={payrollDate.year === new Date().getFullYear() && payrollDate.month === new Date().getMonth() + 1}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition disabled:opacity-30 disabled:cursor-not-allowed">›</button>
                      </div>
                      <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{payroll.rate_label}</span>
                    </div>

                    {/* ── Stat Pills ── */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { icon: <CalendarDays size={18} />, label: "Present Days",   value: `${payroll.present_days} days`,        color: "text-emerald-600", bg: "bg-emerald-50" },
                        { icon: <Clock size={18} />,        label: "Hours Worked",   value: `${payroll.total_hours}h`,              color: "text-indigo-600",  bg: "bg-indigo-50"  },
                        { icon: <BadgeDollarSign size={18}/>,label:"Gross Earnings", value: `₹ ${payroll.gross.toLocaleString()}`,  color: "text-blue-600",    bg: "bg-blue-50"    },
                        { icon: <CircleMinus size={18} />,  label: "Advances",       value: `₹ ${payroll.total_advances.toLocaleString()}`,   color: "text-red-500",    bg: "bg-red-50"    },
                        { icon: <CircleMinus size={18} />,  label: "Deductions",     value: `₹ ${payroll.total_deductions.toLocaleString()}`, color: "text-orange-500", bg: "bg-orange-50" },
                        { icon: <Gift size={18} />,         label: "Bonuses",        value: `₹ ${payroll.total_bonuses.toLocaleString()}`,    color: "text-teal-600",   bg: "bg-teal-50"   },
                      ].map((pill) => (
                        <div key={pill.label} className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-4 shadow-md flex items-center gap-3">
                          <div className={`${pill.bg} ${pill.color} p-2 rounded-xl`}>{pill.icon}</div>
                          <div>
                            <p className="text-xs text-slate-400">{pill.label}</p>
                            <p className={`text-base font-bold ${pill.color}`}>{pill.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Net Payable Hero Card ── */}
                    <div className={`rounded-3xl p-5 md:p-6 shadow-xl flex items-center justify-between gap-4
                      ${payroll.net_payable >= 0
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                        : "bg-gradient-to-r from-red-500 to-rose-500"}`}>
                      <div className="min-w-0">
                        <p className="text-emerald-100 text-sm font-medium">Net Payable</p>
                        <p className="text-white text-2xl md:text-4xl font-extrabold mt-1">
                          ₹ {Math.abs(payroll.net_payable).toLocaleString()}
                        </p>
                        <p className="text-white/70 text-xs mt-1 truncate">
                          {payroll.gross} gross · −{payroll.total_advances + payroll.total_deductions} deducted · +{payroll.total_bonuses} bonus
                        </p>
                      </div>
                      <Wallet size={40} className="text-white/30 shrink-0 hidden sm:block" />
                    </div>

                    {/* ── Advance / Expense Entries ── */}
                    <GlassCard>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                          <CreditCard size={16} className="text-indigo-500" />
                          Advances & Adjustments
                        </h3>
                        <button
                          onClick={() => setEntryModal(true)}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
                        >
                          <Plus size={13} /> Add Entry
                        </button>
                      </div>

                      {payroll.entries.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">No entries for this month</div>
                      ) : (
                        <div className="space-y-2">
                          {payroll.entries.map((e) => (
                            <div key={e.id} className="flex items-center justify-between gap-2 bg-white/70 dark:bg-slate-700/60 rounded-xl px-3 md:px-4 py-3 border border-slate-100 dark:border-slate-600">
                              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0
                                  ${e.entry_type === "bonus" ? "bg-teal-400" :
                                    e.entry_type === "deduction" ? "bg-orange-400" : "bg-red-400"}`} />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{e.entry_type}</p>
                                  {e.note && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{e.note}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                <div className="text-right">
                                  <p className={`text-sm font-bold
                                    ${e.entry_type === "bonus" ? "text-teal-600" : "text-red-500"}`}>
                                    {e.entry_type === "bonus" ? "+" : "−"}₹ {e.amount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500">{e.date}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteEntry(e.id)}
                                  className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 flex items-center justify-center text-red-400 transition"
                                >
                                  <Trash size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCard>

                    {/* ── 6-Month Earnings Bar Chart ── */}
                    <GlassCard>
                      <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-indigo-500" />
                        Earnings — Last 6 Months
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={payroll.history} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
                            formatter={(v, name) => [`₹ ${v}`, name === "gross" ? "Gross" : "Net"]}
                          />
                          <Bar dataKey="gross" name="gross" radius={[4, 4, 0, 0]} fill="#c7d2fe" />
                          <Bar dataKey="net"   name="net"   radius={[4, 4, 0, 0]} fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex gap-4 mt-2 justify-end text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-200 inline-block"/>Gross</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block"/>Net</span>
                      </div>
                    </GlassCard>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Add Payroll Entry Modal ── */}
      {entryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Add Entry</h3>

            {/* Type */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Type</label>
              <div className="flex gap-2 mt-1.5">
                {["advance", "deduction", "bonus"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setEntryForm((f) => ({ ...f, entry_type: t }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize border transition
                      ${entryForm.entry_type === t
                        ? t === "bonus" ? "bg-teal-500 text-white border-teal-500"
                                        : "bg-red-500 text-white border-red-500"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                  >{t}</button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Amount (₹)</label>
              <input
                type="number"
                min="1"
                value={entryForm.amount}
                onChange={(e) => setEntryForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 500"
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Date</label>
              <input
                type="date"
                value={entryForm.date}
                onChange={(e) => setEntryForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Note (optional)</label>
              <input
                type="text"
                value={entryForm.note}
                onChange={(e) => setEntryForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Tool damage, Festival bonus…"
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setEntryModal(false); setEntryForm({ entry_type: "advance", amount: "", date: new Date().toISOString().slice(0, 10), note: "" }); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >Cancel</button>
              <button
                onClick={handleAddEntry}
                disabled={entrySubmitting || !entryForm.amount}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >{entrySubmitting ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Asset Image Preview Modal ── */}
      {previewAsset && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <p className="text-sm font-semibold truncate text-slate-700">{previewAsset.name}</p>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="bg-slate-50 flex items-center justify-center min-h-[360px] p-4">
              <img
                src={previewAsset.download_url}
                alt={previewAsset.name}
                className="max-w-full max-h-[480px] object-contain rounded-lg"
              />
            </div>
            <div className="flex gap-3 px-5 py-3 border-t">
              <button
                onClick={() => handleAssetDownload(previewAsset)}
                className="flex items-center gap-2 bg-indigo-600 text-white text-sm
                           px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
              >
                <Download size={14} />
                Download
              </button>
              <button
                onClick={() => { setAssetDeleteKey(previewAsset.key); setPreviewAsset(null); }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-400/30
                           text-red-600 text-sm px-4 py-2 rounded-xl hover:bg-red-500/20 transition"
              >
                <Trash size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Asset Delete Confirm ── */}
      {assetDeleteKey && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Delete File</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to permanently delete{" "}
              <span className="font-medium text-slate-700 dark:text-slate-200">{assetDeleteKey.split("/").pop()}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setAssetDeleteKey(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssetDelete(assetDeleteKey)}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
          archiveMutation.mutate(payload, {
            onSuccess: () => {
              setDeleteOpen(false);
              navigate("/workers");
            },
          });
        }}
    />
    </DashboardLayout>
  );
}
