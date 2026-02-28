import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useSiteProfile } from "./hooks";
import DashboardLayout from "@/layout/DashboardLayout";
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import SiteFormDialog from "./components/SiteFormDialog";
import DangerousDialog from "@/modules/data_management/components/DangerousActionModal";

import {MapContainer,TileLayer,Circle,} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import {LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer,} from "recharts";

export default function SiteProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);

  const [selectedWorker, setSelectedWorker] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // -----------------------------
// Site Profile Hook
// -----------------------------
const {
  siteQuery,
  workersQuery,
  attendanceQuery,
  archiveMutation,
  toggleMutation,
  updateMutation
} = useSiteProfile(id, {
  tab,
  worker_id: selectedWorker || undefined,
  start_date: startDate || undefined,
  end_date: endDate || undefined,
});

// Extract Data
const site = siteQuery.data;
const workers = workersQuery.data || [];
const attendance = attendanceQuery.data || [];
const isLoading = attendanceQuery.isLoading;

// Filter workers of this site
const siteWorkers = workers.filter((w) => w.site_id === id);

  // -----------------------------
  // Analytics Aggregation
  // -----------------------------
  const analyticsData = useMemo(() => {const map = {};

    attendance.forEach((a) => {
      if (!map[a.date]) {
        map[a.date] = 0;
      }
      map[a.date] += a.total_hours || 0;
    });

    return Object.keys(map).map((date) => ({
      date,
      total_hours: map[date],
    }));
  }, [attendance]);


  if (!site) return <DashboardLayout>Loading...</DashboardLayout>;

  const GlassCard = ({ children }) => (
    <div className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-2xl rounded-3xl p-6">
      {children}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8 bg-gradient-to-br from-slate-100 via-white to-slate-200 min-h-screen">

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to Sites
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT SIDE PROFILE */}
          <GlassCard>
            <div className="relative flex flex-col items-center text-center pt-32 pb-6 space-y-5">

              {/* Gradient Header */}
              <div className="absolute top-0 left-0 w-full h-28 rounded-t-3xl 
                bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 
                opacity-80 blur-[1px]" />

              {/* Circular Map Preview */}
              <div className="w-40 h-40 rounded-full overflow-hidden border-[5px] border-white shadow-2xl">
                <MapContainer
                  center={[site.latitude, site.longitude]}
                  zoom={15}
                  dragging={false}
                  scrollWheelZoom={false}
                  doubleClickZoom={false}
                  zoomControl={false}
                  attributionControl={false}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Circle
                    center={[site.latitude, site.longitude]}
                    radius={site.geofence_radius}
                    pathOptions={{ color: "purple", fillOpacity: 0.2 }}
                  />
                </MapContainer>
              </div>

              {/* Site Name */}
              <h2 className="text-2xl font-bold bg-gradient-to-r 
                             from-purple-500 to-indigo-600 
                             bg-clip-text text-transparent">
                {site.name}
              </h2>

              {/* Status Badge */}
              <div
                className={`px-5 py-1 text-xs rounded-full border backdrop-blur-md ${
                  site.status === "active"
                    ? "bg-green-500/20 text-green-700 border-green-500/40"
                    : "bg-gray-500/20 text-gray-700 border-gray-500/40"
                }`}
              >
                {site.status.toUpperCase()}
              </div>

              {/* Worker Style Toggle */}
              <div
                onClick={() => toggleMutation.mutate()}
                className={`relative w-full h-12 rounded-full cursor-pointer
                  transition-all duration-500 shadow-inner overflow-hidden
                  ${
                    site.status === "active"
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : "bg-gradient-to-r from-gray-400 to-gray-500"
                  }`}
              >
                <div
                  className={`absolute top-1 left-1 h-10 w-1/2 rounded-full 
                    bg-white shadow-xl transition-all duration-500 flex items-center justify-center
                    ${
                      site.status === "active"
                        ? "translate-x-full"
                        : "translate-x-0"
                    }`}
                >
                  <span className="font-bold text-sm text-slate-700">
                    {site.status === "active" ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-between px-6 text-white font-bold text-sm">
                  <span>INACTIVE</span>
                  <span>ACTIVE</span>
                </div>
              </div>

              {/* Edit/Delete */}
              <div className="mt-6 flex gap-4 w-full">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex-1 bg-indigo-500/20 border border-indigo-400/40 
                             text-indigo-700 rounded-xl py-3 font-semibold 
                             shadow-xl hover:scale-105 transition flex items-center justify-center gap-2"
                >
                  <Pencil size={16} />
                  Edit
                </button>

                {!site.is_deleted && (
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="flex-1 bg-amber-500/20 border border-amber-400/40 
                               text-amber-700 rounded-xl py-3 font-semibold 
                               shadow-xl hover:scale-105 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Archive
                  </button>
                )}
              </div>
            </div>
          </GlassCard>

          {/* RIGHT SIDE */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tabs */}
            <div className="flex gap-6 border-b pb-2">
              {["overview", "attendance", "workforce"].map((t) => (
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

            {/* Overview */}
            {tab === "overview" && (
              <GlassCard>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p>{site.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Latitude</p>
                    <p>{site.latitude}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Longitude</p>
                    <p>{site.longitude}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Radius</p>
                    <p>{site.geofence_radius} meters</p>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Attendance */}
            {tab === "attendance" && (
              <GlassCard>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

                  <div>
                    <label className="text-xs text-slate-500">
                      Worker Name
                    </label>
                    <select
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">All Workers</option>
                      {siteWorkers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div className="flex items-end">
                  </div>
                </div>

                {/* Analytics Graph */}
                <div className="h-80 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="total_hours"
                        stroke="#7c3aed"
                        strokeWidth={3}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

              </GlassCard>
            )}

            {/* Workforce */}
            {tab === "workforce" && (
              <GlassCard>
                {siteWorkers.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => navigate(`/workers/${w.id}`)}
                    className="cursor-pointer border-b py-3 hover:underline"
                  >
                    {w.full_name}
                  </div>
                ))}
              </GlassCard>
            )}

          </div>
        </div>
      </div>

      <SiteFormDialog
        open={editOpen}
        initialData={site}
        onClose={() => setEditOpen(false)}
        projects={[]}
        onSubmit={(data) => { updateMutation.mutate( { id, data },{onSuccess: () => {setEditOpen(false);},} ); }}
      />

      <DangerousDialog
        open={deleteOpen}
        title="Archive Site"
        description="Archiving this site will deactivate all workers in it."
        confirmLabel="Archive"
        confirmColor="amber"
        entityName={site?.name}
        onClose={() => setDeleteOpen(false)}
        onConfirm={(payload) => {
          archiveMutation.mutate(payload);
          setDeleteOpen(false);
        }}
      />
    </DashboardLayout>
  );
}