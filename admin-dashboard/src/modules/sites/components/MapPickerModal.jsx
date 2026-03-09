import { useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";

// -----------------------------------
// Map tile layer definitions
// -----------------------------------
const MAP_VIEWS = {
  street: {
    label: "Street",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
  },
  hybrid: {
    label: "Hybrid",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    overlayUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; Esri, OpenStreetMap contributors",
  },
  terrain: {
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap contributors",
  },
};

export default function MapPickerModal({ open, onClose, onConfirm }) {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapView, setMapView] = useState("street");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setPosition(null);
      setAddress("");
      setSearch("");
      setSuggestions([]);
      setExpanded(false);
      setLocating(false);
      setAddressLoading(false);
      setMapView("street");
    }
  }, [open]);

  // -----------------------------------
  // Reverse Geocoding (Backend API)
  // -----------------------------------
  const fetchAddress = useCallback(async (lat, lng) => {
    setAddressLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/geocode/reverse?lat=${lat}&lon=${lng}`);
      const data = await res.json();
      setAddress(data.display_name || "");
    } catch (err) {
      console.error("Reverse geocode error:", err);
      setAddress("");
    } finally {
      setAddressLoading(false);
    }
  }, []);

  // -----------------------------------
  // Bug Fix 1: getCurrentLocation now awaits fetchAddress
  // before enabling Confirm (via addressLoading state)
  // -----------------------------------
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPosition({ lat, lng });
        await fetchAddress(lat, lng); // await so address is ready before Confirm
        setLocating(false);
      },
      (error) => {
        console.error("Location error:", error);
        alert("Unable to fetch your location. Please allow location access.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // -----------------------------------
  // Auto Suggestions via Backend
  // -----------------------------------
  useEffect(() => {
    if (search.length < 3) { setSuggestions([]); return; }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/geocode/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Search error:", err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [search]);

  // -----------------------------------
  // Fly To Location
  // -----------------------------------
  const FlyToLocation = ({ position }) => {
    const map = useMap();
    useEffect(() => {
      if (position) { map.flyTo([position.lat, position.lng], 16, { duration: 1.2 }); }
    }, [position]);
    return null;
  };

  // -----------------------------------
  // Bug Fix 2: ResizeMap triggers on both expanded AND open
  // -----------------------------------
  const ResizeMap = ({ expanded }) => {
    const map = useMap();
    useEffect(() => {
      setTimeout(() => { map.invalidateSize(); }, 300);
    }, [expanded]);
    return null;
  };

  // -----------------------------------
  // Click To Select Location
  // -----------------------------------
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        fetchAddress(e.latlng.lat, e.latlng.lng);
      },
    });
    return position ? <Marker position={position} /> : null;
  };

  const confirmDisabled = !position || addressLoading || locating;

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50
                  transition-opacity duration-200
                  ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      {/* Bug Fix 2: outer wrapper fills full screen, inner panel sized by expanded state */}
      <div
        className={`absolute bg-white shadow-2xl flex flex-col transition-all duration-300
                    ${expanded
                      ? "inset-0 rounded-none"
                      : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[85vh] rounded-2xl"
                    }`}
      >
        {/* HEADER */}
        <div className="p-4 border-b flex justify-between items-center shrink-0">
          <h2 className="text-lg font-semibold">Select Location</h2>

          <div className="flex items-center gap-3">
            {/* Current location button moved to header — outside the map div */}
            <button
              onClick={getCurrentLocation}
              disabled={locating}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {locating ? (
                <span className="animate-pulse">Locating…</span>
              ) : (
                "📍 Use Current Location"
              )}
            </button>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm bg-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-300 transition"
            >
              {expanded ? "⊠ Minimize" : "⛶ Maximize"}
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
          {/* SEARCH */}
          <div className="relative z-[9999] shrink-0">
            <input
              placeholder="Search location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {suggestions.length > 0 && (
              <div className="absolute bg-white border w-full rounded shadow-lg max-h-48 overflow-y-auto z-[9999] mt-1">
                {suggestions.map((s) => (
                  <div
                    key={s.place_id}
                    onClick={() => {
                      const lat = parseFloat(s.lat);
                      const lng = parseFloat(s.lon);
                      setPosition({ lat, lng });
                      setAddress(s.display_name);
                      setSearch(s.display_name);
                      setSuggestions([]);
                    }}
                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm"
                  >
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MAP — flex-1 so it fills all remaining height */}
          <div className="relative flex-1 rounded-lg overflow-hidden border min-h-[300px]">

            {/* View switcher overlay — top-right corner inside the map */}
            <div className="absolute top-2 right-2 z-[1000] flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-md border">
              {Object.entries(MAP_VIEWS).map(([key, view]) => (
                <button
                  key={key}
                  onClick={() => setMapView(key)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition
                    ${mapView === key
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            <MapContainer
              attributionControl={false}
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: "100%", width: "100%" }}
            >
              {/* Base tile layer — swaps on view change */}
              <TileLayer
                key={mapView}
                attribution={MAP_VIEWS[mapView].attribution}
                url={MAP_VIEWS[mapView].url}
              />

              {/* Hybrid: road/label overlay on top of satellite */}
              {mapView === "hybrid" && (
                <TileLayer
                  url={MAP_VIEWS.hybrid.overlayUrl}
                  opacity={0.45}
                  attribution=""
                />
              )}

              <FlyToLocation position={position} />
              <LocationMarker />
              <ResizeMap expanded={expanded} />
            </MapContainer>
          </div>

          {/* ADDRESS — shown below map, includes loading state */}
          <div className="shrink-0 min-h-[2.5rem]">
            {addressLoading ? (
              <div className="text-sm text-slate-400 bg-slate-50 p-3 rounded-lg animate-pulse">
                Fetching address…
              </div>
            ) : address ? (
              <div className="text-sm text-slate-700 bg-slate-100 p-3 rounded-lg">
                📌 {address}
              </div>
            ) : position ? (
              <div className="text-sm text-slate-400 bg-slate-50 p-3 rounded-lg">
                {`Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}`}
              </div>
            ) : (
              <div className="text-sm text-slate-400 p-3">
                Click on the map or search to select a location.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-4 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400">
            {position ? `Selected: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : "No location selected"}
          </span>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-black transition"
            >
              Cancel
            </button>

            <button
              disabled={confirmDisabled}
              onClick={() => {
                onConfirm({
                  latitude: position.lat,
                  longitude: position.lng,
                  address,
                });
                onClose();
              }}
              className="bg-green-600 text-white px-5 py-2 rounded-lg disabled:opacity-50 hover:bg-green-700 transition"
            >
              {addressLoading ? "Loading…" : "Confirm Location"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
