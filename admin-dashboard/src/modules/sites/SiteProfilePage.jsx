import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSiteProfile } from "./hooks";
import api from "@/core/api/axios";
import DashboardLayout from "@/layout/DashboardLayout";
import { ArrowLeft, Trash2, Pencil, CircleDot, Hexagon } from "lucide-react";
import SiteFormDialog from "./components/SiteFormDialog";
import DangerousDialog from "@/modules/data_management/components/DangerousActionModal";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Component } from "react";

import {LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer,} from "recharts";

const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
const HAS_GOOGLE_MAPS_KEY = GOOGLE_MAPS_KEY.length > 0;

// ── Error boundary so a map crash doesn't white-screen the whole page ──
class MapErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
          Map preview unavailable
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Draws a circle or polygon boundary overlay on a Google Map ──
function BoundaryOverlay({ site }) {
  const map = useMap();
  const mapsLib = useMapsLibrary("maps");
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!map || !mapsLib || !site) return;

    // Remove previous overlay
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    // Normalise — old circle sites may have boundary_type = null
    const boundaryType = site.boundary_type || "circle";
    const coords = Array.isArray(site.polygon_coords) ? site.polygon_coords : [];
    const validPolygon = boundaryType === "polygon" && coords.length >= 3;

    try {
      if (validPolygon) {
        const paths = coords.map((p) => ({
          lat: parseFloat(p.lat),
          lng: parseFloat(p.lng ?? p.lon),
        }));
        const polygon = new mapsLib.Polygon({
          paths,
          strokeColor: "#6366f1",
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: "#6366f1",
          fillOpacity: 0.2,
          map,
        });
        overlayRef.current = polygon;

        const bounds = new mapsLib.LatLngBounds();
        paths.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, 30);
      } else {
        const center = { lat: parseFloat(site.latitude), lng: parseFloat(site.longitude) };
        if (isNaN(center.lat) || isNaN(center.lng)) return;

        const circle = new mapsLib.Circle({
          center,
          radius: parseFloat(site.geofence_radius) || 200,
          strokeColor: "#6366f1",
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: "#6366f1",
          fillOpacity: 0.2,
          map,
        });
        overlayRef.current = circle;
        map.fitBounds(circle.getBounds(), 30);
      }
    } catch (err) {
      console.warn("BoundaryOverlay render error:", err);
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
    };
  }, [map, mapsLib, site]);

  return null;
}

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

// Fetch projects for the edit dialog dropdown
const { data: projects = [] } = useQuery({
  queryKey: ["projects"],
  queryFn: async () => (await api.get("/projects/")).data,
});

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
    <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 shadow-2xl rounded-3xl p-4 md:p-6">
      {children}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-5 md:space-y-8 bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 min-h-screen">

        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Sites
        </button>

        {/* Main layout — stacked on mobile, side-by-side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8">

          {/* LEFT SIDE PROFILE */}
          <GlassCard>
            <div className="relative flex flex-col items-center text-center pt-32 pb-6 space-y-5">

              {/* Gradient Header */}
              <div className="absolute top-0 left-0 w-full h-28 rounded-t-3xl 
                bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 
                opacity-80 blur-[1px]" />

              {/* Circular Map Preview */}
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-[5px] border-white shadow-2xl">
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${site.latitude},${site.longitude}&zoom=15&size=160x160&maptype=roadmap&markers=color:purple%7C${site.latitude},${site.longitude}&key=${GOOGLE_MAPS_KEY}`}
                  alt="Site location"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Site Name */}
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">
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

              {/* Active/Inactive Toggle */}
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
                    ${site.status === "active" ? "translate-x-full" : "translate-x-0"}`}
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

              {/* Edit / Archive */}
              <div className="mt-4 flex gap-3 w-full">
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex-1 bg-indigo-500/20 border border-indigo-400/40 
                             text-indigo-700 dark:text-indigo-300 rounded-xl py-3 font-semibold 
                             shadow-xl hover:scale-105 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Pencil size={15} />
                  Edit
                </button>

                {!site.is_deleted && (
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="flex-1 bg-amber-500/20 border border-amber-400/40 
                               text-amber-700 dark:text-amber-400 rounded-xl py-3 font-semibold 
                               shadow-xl hover:scale-105 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={15} />
                    Archive
                  </button>
                )}
              </div>
            </div>
          </GlassCard>

          {/* RIGHT SIDE */}
          <div className="lg:col-span-2 space-y-5 md:space-y-6">

            {/* Tabs */}
            <div className="flex gap-4 md:gap-6 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
              {["overview", "attendance", "workforce"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`capitalize pb-1 whitespace-nowrap text-sm md:text-base transition-colors ${
                    tab === t
                      ? "border-b-2 border-black dark:border-white font-medium text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Overview */}
            {tab === "overview" && (
              <GlassCard>
                {/* Info Grid */}
                {(() => {
                  const boundaryType = site.boundary_type || "circle";
                  const polygonCoords = Array.isArray(site.polygon_coords) ? site.polygon_coords : [];
                  return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Address</p>
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm md:text-base">{site.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Latitude</p>
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm md:text-base">{site.latitude}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Longitude</p>
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm md:text-base">{site.longitude}</p>
                  </div>

                  {/* Boundary Type */}
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Boundary Type</p>
                    <div className="flex items-center gap-2 mt-1">
                      {boundaryType === "polygon" ? (
                        <>
                          <Hexagon size={16} className="text-indigo-500" />
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 capitalize text-sm">Polygon</span>
                          <span className="text-xs text-slate-400">({polygonCoords.length} points)</span>
                        </>
                      ) : (
                        <>
                          <CircleDot size={16} className="text-purple-500" />
                          <span className="font-semibold text-purple-600 dark:text-purple-400 capitalize text-sm">Circle</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Radius — only for circle */}
                  {boundaryType !== "polygon" && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Geofence Radius</p>
                      <p className="font-medium text-slate-800 dark:text-slate-100 text-sm md:text-base">{site.geofence_radius} meters</p>
                    </div>
                  )}
                </div>
                  );
                })()}

                {/* Boundary Map Preview */}
                <div className="rounded-2xl overflow-hidden border border-white/40 shadow-inner" style={{ height: 280 }}>
                  <MapErrorBoundary>
                    {HAS_GOOGLE_MAPS_KEY ? (
                      <APIProvider apiKey={GOOGLE_MAPS_KEY} language="en" region="US">
                        <Map
                          defaultCenter={{ lat: parseFloat(site.latitude) || 20.5937, lng: parseFloat(site.longitude) || 78.9629 }}
                          defaultZoom={15}
                          gestureHandling="cooperative"
                          disableDefaultUI={false}
                          mapTypeControl={false}
                          streetViewControl={false}
                          fullscreenControl={false}
                          style={{ width: "100%", height: "100%" }}
                        >
                          <BoundaryOverlay site={site} />
                        </Map>
                      </APIProvider>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center px-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        Google Maps key is missing. Set VITE_GOOGLE_MAPS_API_KEY in your .env.local and restart the app.
                      </div>
                    )}
                  </MapErrorBoundary>
                </div>
              </GlassCard>
            )}

            {/* Attendance */}
            {tab === "attendance" && (
              <GlassCard>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">

                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Worker Name
                    </label>
                    <select
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm mt-0.5"
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
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm mt-0.5"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm mt-0.5"
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
                {siteWorkers.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">No workers assigned to this site.</p>
                ) : (
                  siteWorkers.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => navigate(`/workers/${w.id}`)}
                      className="cursor-pointer border-b border-slate-100 dark:border-slate-700 py-3 text-sm text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
                    >
                      {w.full_name}
                    </div>
                  ))
                )}
              </GlassCard>
            )}

          </div>
        </div>
      </div>

      <SiteFormDialog
        open={editOpen}
        initialData={site}
        onClose={() => setEditOpen(false)}
        projects={projects}
        onSubmit={async (data) => {
          try {
            await updateMutation.mutateAsync({ id, data });
          } catch (err) {
            throw err;
          }
        }}
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
          archiveMutation.mutate(payload, {
            onSuccess: () => {
              setDeleteOpen(false);
              navigate("/sites");
            },
          });
        }}
      />
    </DashboardLayout>
  );
}