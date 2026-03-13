import { useState, useEffect, useRef, useCallback } from "react";
import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
  Marker,
} from "@vis.gl/react-google-maps";
import { Search, X, MapPin, Maximize2, Minimize2, Trash2, CircleDot, Hexagon } from "lucide-react";

const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
const HAS_GOOGLE_MAPS_KEY = GOOGLE_MAPS_KEY.length > 0;
const API_BASE        = import.meta.env.VITE_API_BASE_URL;

// ─────────────────────────────────────────────────────────────
// MapContent — lives inside <Map> so useMap() works
// Handles: circle/polygon drawing, map click, programmatic pan
// ─────────────────────────────────────────────────────────────
function MapContent({
  mode,
  flyTo,                  // { lat, lng, zoom? } — triggers panTo
  onFlyDone,              // clears flyTo after pan
  circleCenter,
  setCircleCenter,
  circleRadius,
  polygonPoints,
  setPolygonPoints,
  onAddressResolved,
}) {
  const map     = useMap();
  const mapsLib = useMapsLibrary("maps");

  const circleRef = useRef(null);
  const polyRef   = useRef(null);

  // ── Programmatic pan (triggered by search / GPS) ──
  useEffect(() => {
    if (!map || !flyTo) return;
    map.panTo({ lat: flyTo.lat, lng: flyTo.lng });
    map.setZoom(flyTo.zoom ?? 15);
    onFlyDone();
  }, [flyTo, map, onFlyDone]);

  // ── Draw / update circle ──
  useEffect(() => {
    if (!mapsLib || !map) return;
    if (mode !== "circle" || !circleCenter) {
      circleRef.current?.setMap(null);
      return;
    }
    if (!circleRef.current) {
      circleRef.current = new mapsLib.Circle({
        strokeColor: "#4f46e5",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#6366f1",
        fillOpacity: 0.18,
        map,
        center: circleCenter,
        radius: circleRadius,
      });
    } else {
      circleRef.current.setCenter(circleCenter);
      circleRef.current.setRadius(circleRadius);
      circleRef.current.setMap(map);
    }
  }, [mode, circleCenter, circleRadius, mapsLib, map]);

  // ── Draw / update polygon ──
  useEffect(() => {
    if (!mapsLib || !map) return;
    if (mode !== "polygon" || polygonPoints.length < 3) {
      polyRef.current?.setMap(null);
      return;
    }
    if (!polyRef.current) {
      polyRef.current = new mapsLib.Polygon({
        paths: polygonPoints,
        strokeColor: "#4f46e5",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#6366f1",
        fillOpacity: 0.18,
        map,
      });
    } else {
      polyRef.current.setPaths(polygonPoints);
      polyRef.current.setMap(map);
    }
  }, [mode, polygonPoints, mapsLib, map]);

  // ── Cleanup overlays on mode switch ──
  useEffect(() => {
    if (mode === "circle") {
      polyRef.current?.setMap(null);
      polyRef.current = null;
    } else {
      circleRef.current?.setMap(null);
      circleRef.current = null;
    }
  }, [mode]);

  // ── Map click → place pin / point ──
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", async (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (mode === "circle") {
        setCircleCenter({ lat, lng });
        try {
          const res  = await fetch(`${API_BASE}/geocode/reverse?lat=${lat}&lon=${lng}`);
          const data = await res.json();
          onAddressResolved(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          onAddressResolved(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      } else {
        setPolygonPoints((prev) => {
          const next = [...prev, { lat, lng }];
          if (next.length === 3) {
            const avgLat = next.reduce((s, p) => s + p.lat, 0) / next.length;
            const avgLng = next.reduce((s, p) => s + p.lng, 0) / next.length;
            fetch(`${API_BASE}/geocode/reverse?lat=${avgLat}&lon=${avgLng}`)
              .then((r) => r.json())
              .then((d) => onAddressResolved(d.display_name || ""))
              .catch(() => {});
          }
          return next;
        });
      }
    });
    return () => listener.remove();
  }, [map, mode, setCircleCenter, setPolygonPoints, onAddressResolved]);

  return null;
}

// ─────────────────────────────────────────────────────────────
// Radius control — floats over map bottom
// ─────────────────────────────────────────────────────────────
function CircleRadiusControl({ radius, onChange }) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10
                    bg-white dark:bg-slate-800 rounded-2xl shadow-xl
                    px-5 py-3 flex items-center gap-4
                    border border-slate-200 dark:border-slate-700
                    pointer-events-auto">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
        Radius (m)
      </label>
      <input
        type="range" min={50} max={5000} step={50}
        value={radius}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-36 accent-indigo-600"
      />
      <input
        type="number" min={50} max={5000} step={50}
        value={radius}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 border dark:border-slate-600 rounded-lg px-2 py-1 text-sm
                   text-center dark:bg-slate-700 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Polygon markers — numbered dots, click to remove
// ─────────────────────────────────────────────────────────────
function PolygonMarkers({ points, onRemove }) {
  return points.map((p, i) => (
    <Marker
      key={i}
      position={p}
      label={{ text: String(i + 1), color: "white", fontSize: "10px", fontWeight: "bold" }}
      title="Click to remove this point"
      onClick={() => onRemove(i)}
    />
  ));
}

// ─────────────────────────────────────────────────────────────
// Search box — calls backend /geocode/autocomplete → /geocode/place
// ─────────────────────────────────────────────────────────────
function SearchBox({ onSelect }) {
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`${API_BASE}/geocode/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  const handleSelect = async (item) => {
    setQuery(item.description);
    setSuggestions([]);
    try {
      const res  = await fetch(`${API_BASE}/geocode/place?place_id=${item.place_id}`);
      const data = await res.json();
      if (data.lat != null) {
        onSelect({ lat: data.lat, lng: data.lng, address: data.address });
      }
    } catch { /* silent */ }
  };

  return (
    <div className="relative z-[300]">
      <div className="flex items-center gap-2 bg-white dark:bg-slate-800
                      border border-slate-200 dark:border-slate-600
                      rounded-xl px-3 py-2 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          className="flex-1 text-sm bg-transparent outline-none
                     placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500"
          placeholder="Search places, cities, addresses…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => { setQuery(""); setSuggestions([]); }}>
            <X className="w-4 h-4 text-slate-400 hover:text-red-500 transition" />
          </button>
        )}
        {loading && <span className="text-xs text-indigo-500 animate-pulse font-bold">…</span>}
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1
                       bg-white dark:bg-slate-800
                       border border-slate-200 dark:border-slate-700
                       rounded-xl shadow-2xl overflow-hidden list-none p-0 m-0">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSelect(s)}
              className="flex items-start gap-2 px-4 py-2.5
                         hover:bg-indigo-50 dark:hover:bg-slate-700
                         cursor-pointer transition"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <span className="text-sm text-slate-700 dark:text-slate-200 leading-tight">
                {s.description}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────
export default function MapPickerModal({ open, onClose, onConfirm, initialMode = "circle" }) {
  const [mode,          setMode]          = useState(initialMode);
  const [expanded,      setExpanded]      = useState(false);
  const [circleCenter,  setCircleCenter]  = useState(null);
  const [circleRadius,  setCircleRadius]  = useState(200);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [address,       setAddress]       = useState("");
  const [locating,      setLocating]      = useState(false);
  // flyTo triggers programmatic pan inside MapContent
  const [flyTo,         setFlyTo]         = useState(null);

  // Reset when modal opens
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setCircleCenter(null);
    setCircleRadius(200);
    setPolygonPoints([]);
    setAddress("");
    setFlyTo(null);
    setExpanded(false);
  }, [open, initialMode]);

  const handleAddressResolved = useCallback((addr) => setAddress(addr), []);

  // Search result → fly map to location
  const handleSearchSelect = useCallback(({ lat, lng, address: addr }) => {
    setAddress(addr);
    setFlyTo({ lat, lng, zoom: 15 });
    if (mode === "circle") setCircleCenter({ lat, lng });
  }, [mode]);

  // GPS → fly map to current position
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setFlyTo({ lat, lng, zoom: 16 });
        if (mode === "circle") setCircleCenter({ lat, lng });
        try {
          const res  = await fetch(`${API_BASE}/geocode/reverse?lat=${lat}&lon=${lng}`);
          const data = await res.json();
          setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        } catch {
          setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const removePolygonPoint = (idx) =>
    setPolygonPoints((prev) => prev.filter((_, i) => i !== idx));

  const polygonCentroid = polygonPoints.length > 0
    ? {
        lat: polygonPoints.reduce((s, p) => s + p.lat, 0) / polygonPoints.length,
        lng: polygonPoints.reduce((s, p) => s + p.lng, 0) / polygonPoints.length,
      }
    : null;

  const canConfirm = mode === "circle" ? circleCenter != null : polygonPoints.length >= 3;

  const handleConfirm = () => {
    if (mode === "circle") {
      onConfirm({
        latitude:        circleCenter.lat,
        longitude:       circleCenter.lng,
        address,
        boundary_type:   "circle",
        geofence_radius: circleRadius,
        polygon_coords:  null,
      });
    } else {
      onConfirm({
        latitude:        polygonCentroid.lat,
        longitude:       polygonCentroid.lng,
        address,
        boundary_type:   "polygon",
        geofence_radius: 0,
        polygon_coords:  polygonPoints,
      });
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center">
      <div className={`bg-white dark:bg-slate-900 flex flex-col shadow-2xl transition-all duration-300
        ${expanded ? "fixed inset-0 rounded-none" : "w-[820px] h-[88vh] rounded-2xl overflow-hidden"}`}
      >

        {/* ── HEADER ── */}
        <div className="px-5 py-4 border-b dark:border-slate-700 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Select Site Location</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLocate}
              disabled={locating}
              className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              {locating ? "Locating…" : "My Location"}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            >
              {expanded
                ? <Minimize2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                : <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
            >
              <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="px-5 py-3 border-b dark:border-slate-700 flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => { setMode("circle"); setPolygonPoints([]); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition
                ${mode === "circle"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              <CircleDot className="w-3.5 h-3.5" /> Circle
            </button>
            <button
              onClick={() => { setMode("polygon"); setCircleCenter(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition
                ${mode === "polygon"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              <Hexagon className="w-3.5 h-3.5" /> Polygon
            </button>
          </div>

          <div className="flex-1 min-w-[200px]">
            <SearchBox onSelect={handleSearchSelect} />
          </div>

          {mode === "polygon" && polygonPoints.length > 0 && (
            <button
              onClick={() => setPolygonPoints([])}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:underline shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── INSTRUCTION BANNER ── */}
        <div className="px-5 py-2 shrink-0 bg-indigo-50 dark:bg-indigo-900/20 border-b dark:border-slate-700">
          {mode === "circle" ? (
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              🖱 <strong>Click on the map</strong> to set the site centre · drag to pan · scroll to zoom · adjust radius below
            </p>
          ) : (
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              🖱 <strong>Click to place boundary points</strong> (min 3) · click a numbered pin to remove it
              {polygonPoints.length > 0 && (
                <strong className="ml-2">
                  {polygonPoints.length} point{polygonPoints.length !== 1 ? "s" : ""}
                  {polygonPoints.length < 3 ? ` — need ${3 - polygonPoints.length} more` : " ✓"}
                </strong>
              )}
            </p>
          )}
        </div>

        {/* ── MAP ── */}
        <div className="flex-1 relative overflow-hidden">
          {HAS_GOOGLE_MAPS_KEY ? (
            <APIProvider apiKey={GOOGLE_MAPS_KEY} language="en" region="US">
              <Map
                defaultCenter={{ lat: 20.5937, lng: 78.9629 }}
                defaultZoom={5}
                gestureHandling="greedy"
                disableDefaultUI={false}
                style={{ width: "100%", height: "100%" }}
              >
                <MapContent
                  mode={mode}
                  flyTo={flyTo}
                  onFlyDone={() => setFlyTo(null)}
                  circleCenter={circleCenter}
                  setCircleCenter={setCircleCenter}
                  circleRadius={circleRadius}
                  polygonPoints={polygonPoints}
                  setPolygonPoints={setPolygonPoints}
                  onAddressResolved={handleAddressResolved}
                />

                {mode === "circle" && circleCenter && (
                  <Marker position={circleCenter} />
                )}

                {mode === "polygon" && (
                  <PolygonMarkers points={polygonPoints} onRemove={removePolygonPoint} />
                )}
              </Map>
            </APIProvider>
          ) : (
            <div className="h-full w-full flex items-center justify-center px-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Google Maps key is missing. Set VITE_GOOGLE_MAPS_API_KEY in your .env.local and restart the app.
            </div>
          )}

          {mode === "circle" && circleCenter && (
            <CircleRadiusControl radius={circleRadius} onChange={setCircleRadius} />
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="px-5 py-4 border-t dark:border-slate-700 flex items-center justify-between shrink-0 flex-wrap gap-3">
          <div className="flex-1 min-w-0">
            {address ? (
              <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span className="truncate">{address}</span>
              </div>
            ) : (
              <span className="text-sm text-slate-400 dark:text-slate-500">
                {mode === "circle" ? "Click on the map to select centre" : "Click on the map to start placing points"}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              disabled={!canConfirm}
              onClick={handleConfirm}
              className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
            >
              Confirm Location
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
