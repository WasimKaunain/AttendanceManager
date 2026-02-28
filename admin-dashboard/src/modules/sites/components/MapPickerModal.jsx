import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";

export default function MapPickerModal({ open, onClose, onConfirm }) {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [expanded, setExpanded] = useState(false);

  // -----------------------------------
  // Reverse Geocoding (Backend API)
  // -----------------------------------
  const fetchAddress = async (lat, lng) => {
    try 
        {
          const res = await fetch(`http://127.0.0.1:8000/geocode/reverse?lat=${lat}&lon=${lng}`);
        
          const data = await res.json();
          setAddress(data.display_name || "");
        } 
    catch (err) 
        {
          console.error("Reverse geocode error:", err);
        }
  };

  const getCurrentLocation = () => {
  if (!navigator.geolocation) {alert("Geolocation not supported by your browser");return;}

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setPosition({ lat, lng });
      fetchAddress(lat, lng);
    },
    (error) => {
      console.error("Location error:", error);
      alert("Unable to fetch location");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
};

  // -----------------------------------
  // Auto Suggestions via Backend
  // -----------------------------------
  useEffect(() => 
    {
    if (search.length < 3) { setSuggestions([]); return;}

    const timeout = setTimeout(async () => 
      {
      try 
          {
            const res = await fetch(`http://127.0.0.1:8000/geocode/search?q=${encodeURIComponent(search)}`);
          
            const data = await res.json();
            setSuggestions(data);
          } 
      catch (err) 
          {
            console.error("Search error:", err);
          }
      }, 500);

      return () => clearTimeout(timeout);
    }, [search]);

  // -----------------------------------
  // Fly To Location
  // -----------------------------------
  const FlyToLocation = ({ position }) => 
    {
    const map = useMap();

    useEffect(() => 
      {
        if (position) {map.flyTo([position.lat, position.lng], 16, {duration: 1.2,});}
      }, [position]);

      return null;
    };

  // -----------------------------------
  // Resize Map on Expand
  // -----------------------------------
  const ResizeMap = ({ expanded }) => 
    {
    const map = useMap();

    useEffect(() => 
      {
        setTimeout(() => {map.invalidateSize();}, 200);
      }, [expanded]);

    return null;
    };

  // -----------------------------------
  // Click To Select Location
  // -----------------------------------
  const LocationMarker = () => 
    {
    useMapEvents({ click(e) {setPosition(e.latlng);fetchAddress(e.latlng.lat, e.latlng.lng);},});

    return position ? <Marker position={position} /> : null;
    };

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm
                  flex items-center justify-center
                  p-6 z-50 overflow-auto
                  transition-opacity duration-200
                  ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl
                    flex flex-col transition-all duration-300
                    ${expanded
                      ? "w-[95vw] h-[90vh]"
                      : "w-[750px] max-h-[85vh]"
                    }`}
      >
        {/* HEADER */}
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Select Location</h2>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm bg-slate-200 px-3 py-1 rounded hover:bg-slate-300 transition"
          >
            {expanded ? "Minimize" : "Maximize"}
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* SEARCH */}
          <div className="relative z-[9999]">
            <input
              placeholder="Search location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
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

          {/* MAP */}
          <div className="h-[400px] rounded-lg overflow-hidden border">
            <button
              onClick={getCurrentLocation}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
            >
            Use Current Location
            </button>
            
            <MapContainer attributionControl={false}
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FlyToLocation position={position} />
              <LocationMarker />
              <ResizeMap expanded={expanded} />
            </MapContainer>
          </div>

          {/* ADDRESS */}
          {address && (
            <div className="text-sm text-slate-700 bg-slate-100 p-3 rounded-lg">
              {address}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-black transition"
          >
            Cancel
          </button>

          <button
            disabled={!position}
            onClick={() => {
              onConfirm({
                latitude: position.lat,
                longitude: position.lng,
                address,
              });
              onClose();
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:scale-105 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
