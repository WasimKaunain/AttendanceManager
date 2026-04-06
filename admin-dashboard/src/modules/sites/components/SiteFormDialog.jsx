import { useState, useEffect } from "react";
import MapPickerModal from "./MapPickerModal";
import { CircleDot, Hexagon, MapPin } from "lucide-react";
import { getTimezoneFromCoords,getAllTimezones } from "../services";

export default function SiteFormDialog({ open, onClose, onSubmit, initialData, projects, isSubmitting }) {
  const [form, setForm] = useState({
    name: "",
    project_id: "",
    address: "",
    latitude: "",
    longitude: "",
    geofence_radius: 200,
    boundary_type: "circle",
    polygon_coords: null,
    status: "active",
    timezone: "",
  });
  const [mapOpen, setMapOpen] = useState(false);
  const [errors, setErrors]   = useState({});
  const [popup, setPopup]     = useState(null);
  const [loadingTimezone, setLoadingTimezone] = useState(false);
  const [timezones, setTimezones] = useState([]);
  const [loadingTimezones, setLoadingTimezones] = useState(false);

  useEffect(() => {
  if (mapOpen && timezones.length === 0) {
    setLoadingTimezones(true);

    getAllTimezones()
      .then(setTimezones)
      .catch(() => setTimezones([]))
      .finally(() => setLoadingTimezones(false));
  }
}, [mapOpen]);

  useEffect(() => {
    if (initialData) {
      setForm({
        name:           initialData.name           || "",
        project_id:     initialData.project_id     || "",
        address:        initialData.address        || "",
        latitude:       initialData.latitude       || "",
        longitude:      initialData.longitude      || "",
        geofence_radius: initialData.geofence_radius ?? 200,
        boundary_type:  initialData.boundary_type  || "circle",
        polygon_coords: initialData.polygon_coords || null,
        status:         initialData.status         || "active",
        timezone:       initialData.timezone       || "",
      });
    } else {
      setForm({
        name: "", project_id: "", address: "",
        latitude: "", longitude: "",
        geofence_radius: 200,
        boundary_type: "circle",
        polygon_coords: null,
        status: "active",
      });
    }
    setErrors({});
    setPopup(null);
  }, [initialData, open]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!form.name)       e.name       = "Site name is required";
    if (!form.project_id) e.project_id = "Please select a project";
    if (!form.latitude)   e.latitude   = "Latitude is required";
    if (!form.longitude)  e.longitude  = "Longitude is required";
    if (!form.timezone) e.timezone = "Timezone is required";
    if (form.boundary_type === "polygon" && (!form.polygon_coords || form.polygon_coords.length < 3))
      e.polygon_coords = "Draw at least 3 boundary points on the map";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  function getPolygonCentroid(points) {
    if (!points || points.length === 0) return null;

    const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;

    return { lat, lng };
  }

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await onSubmit(form);
      setPopup({
        type: "success",
        message: initialData ? `Site "${form.name}" updated!` : `Site "${form.name}" created!`,
      });
      setTimeout(() => { setPopup(null); onClose(); }, 1800);
    } catch (err) {
      let message = initialData ? "Failed to update site." : "Failed to create site.";
      if (err?.response?.data?.detail) {
        const d = err.response.data.detail;
        message = Array.isArray(d) ? d.map((x) => x.msg || JSON.stringify(x)).join(", ") : String(d);
      } else if (err?.message) {
        message = err.message;
      }
      setPopup({ type: "error", message });
    }
  };

  const isPolygon = form.boundary_type === "polygon";
  const hasLocation = form.latitude && form.longitude;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-2xl w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {initialData ? "Edit Site" : "New Site"}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Fill in the details and select the site location on the map.
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">

            {/* Project */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Project
              </label>
              <select
                value={form.project_id}
                onChange={(e) => {
                  const selectedProject = projects.find(p => p.id === e.target.value);
                
                  setForm({
                    ...form,
                    project_id: e.target.value,
                    name: selectedProject ? selectedProject.name : form.name, // autofill
                  });
                
                  setErrors((p) => ({ ...p, project_id: undefined }));
                }}
                className={`w-full border dark:border-slate-600 rounded-xl p-3 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 ${errors.project_id ? "border-red-400 bg-red-50 dark:bg-red-900/20" : ""}`}
              >
                <option value="">Select Project</option>
                {projects.filter((p) => p.status === "active").map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
              {errors.project_id && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                  {errors.project_id}
                </p>
              )}
            </div>
            
            {/* Site Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Site Name
              </label>
              <input
                placeholder="e.g. Main Gate, Block A..."
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value }); // still editable
                  setErrors((p) => ({ ...p, name: undefined }));
                }}
                className={`w-full border dark:border-slate-600 rounded-xl p-3 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? "border-red-400 bg-red-50 dark:bg-red-900/20" : ""}`}
              />
              {errors.name && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Boundary Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Site Boundary Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, boundary_type: "circle", polygon_coords: null })}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition
                    ${form.boundary_type === "circle"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300"}`}
                >
                  <CircleDot className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-semibold text-xs">Circle</div>
                    <div className="text-[10px] opacity-70">Centre point + radius</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, boundary_type: "polygon", geofence_radius: 0 })}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition
                    ${form.boundary_type === "polygon"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300"}`}
                >
                  <Hexagon className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-semibold text-xs">Polygon</div>
                    <div className="text-[10px] opacity-70">Draw custom boundary</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Radius input — only for circle */}
            {!isPolygon && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Geofence Radius (meters)
                </label>
                <input
                  type="number"
                  min={50}
                  placeholder="200"
                  value={form.geofence_radius}
                  onChange={(e) => setForm({ ...form, geofence_radius: Number(e.target.value) })}
                  className="w-full border dark:border-slate-600 rounded-xl p-3 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Map picker button + location preview */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Location
              </label>

              {hasLocation && (
                <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/60 rounded-xl px-3 py-2.5 mb-2 border dark:border-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    {form.address && <p className="truncate font-medium">{form.address}</p>}
                    <p className="text-slate-400 font-mono">
                      {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
                    </p>
                    {isPolygon && form.polygon_coords?.length > 0 && (
                      <p className="text-indigo-500 mt-0.5">
                        Polygon — {form.polygon_coords.length} boundary points
                      </p>
                    )}
                    {!isPolygon && (
                      <p className="text-indigo-500 mt-0.5">
                        Circle — radius {form.geofence_radius}m
                      </p>
                    )}
                  </div>
                </div>
              )}

              {errors.latitude  && <p className="text-red-500 dark:text-red-400 text-xs mb-1">{errors.latitude}</p>}
              {errors.longitude && <p className="text-red-500 dark:text-red-400 text-xs mb-1">{errors.longitude}</p>}
              {errors.polygon_coords && <p className="text-red-500 dark:text-red-400 text-xs mb-1">{errors.polygon_coords}</p>}

              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                {hasLocation ? "Change Location on Map" : "Select Location on Map"}
              </button>
            </div>


            {/*Timezone selector (auto-filled from map coords)*/}
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                Timezone
              </label>

              <select
                value={form.timezone}
                onChange={(e) => {
                  setForm({ ...form, timezone: e.target.value });
                  setErrors((p) => ({ ...p, timezone: undefined }));
                }}
                disabled={!form.latitude}
                className={`w-full border rounded-xl p-3 text-sm ${
                  !form.latitude ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              >
                <option value="">
                    {loadingTimezones ? "Loading timezones..." : "Select Timezone"}
                  </option>

                  {/* ⭐ Show detected timezone first */}
                  {form.timezone && (
                    <option value={form.timezone}>⭐ {form.timezone} (Detected)</option>
                  )}

                  {/* Full list */}
                  {timezones.filter((tz) => tz !== form.timezone).map((tz) => (<option key={tz} value={tz}>{tz}</option>
                    ))}
              </select>

                {loadingTimezone && (
                  <p className="text-xs text-slate-400 mt-1">
                    Detecting timezone...
                  </p>
                )}

              {form.timezone && (
                <p className="text-xs text-indigo-500 mt-1">
                  Auto-selected from map (you can change it)
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border dark:border-slate-600 rounded-xl p-3 text-sm bg-white dark:bg-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Popup toast */}
            {popup && (
              <div className={`p-3 rounded-xl text-sm font-medium ${
                popup.type === "success"
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700"
                  : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
              }`}>
                {popup.message}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="px-6 pb-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-black dark:bg-indigo-600 text-white hover:opacity-90 disabled:opacity-50 transition shadow-md"
            >
              {isSubmitting ? "Saving…" : "Save Site"}
            </button>
          </div>
        </div>
      </div>

      <MapPickerModal
        open={mapOpen}
        initialMode={form.boundary_type}
        onClose={() => setMapOpen(false)}
        onConfirm={async ({ latitude, longitude, address, boundary_type, geofence_radius, polygon_coords }) => {
          let lat = latitude;
          let lng = longitude;
        
          // ✅ Handle polygon
          if (boundary_type === "polygon" && polygon_coords?.length > 0) {
            const centroid = getPolygonCentroid(polygon_coords);
            if (centroid) {
              lat = centroid.lat;
              lng = centroid.lng;
            }
          }
        
          let timezone = form.timezone;
        
          try {
            setLoadingTimezone(true);
          
            const res = await getTimezoneFromCoords({ lat, lng });
            timezone = res.timezone;

          } catch (err) {
            console.error("Timezone fetch failed", err);
          } finally {
            setLoadingTimezone(false);
          }
        
          setForm((prev) => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            address: address || prev.address,
            boundary_type,
            geofence_radius: boundary_type === "circle" ? geofence_radius : prev.geofence_radius,
            polygon_coords: boundary_type === "polygon" ? polygon_coords : null,
            timezone, // ✅ AUTO SET
          }));
        
          setErrors((p) => ({
            ...p,
            latitude: undefined,
            longitude: undefined,
            polygon_coords: undefined,
          }));
        }}
      />
    </>
  );
}
