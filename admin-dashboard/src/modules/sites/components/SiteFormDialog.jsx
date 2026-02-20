import { useState, useEffect } from "react";
import MapPickerModal from "./MapPickerModal";


export default function SiteFormDialog({open,onClose,onSubmit,initialData,projects,isSubmitting,}) {
  const [form, setForm] = useState({
    name: "",
    project_id: "",
    address: "",
    latitude: "",
    longitude: "",
    geofence_radius: 200,
    status: "active",
  });
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  if (!open) return null;

  return (
  <>
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[420px] p-6">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Site" : "New Site"}
        </h2>

        <div className="space-y-3">
          <input
            placeholder="Site Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full border rounded p-2"
          />

          <select
            value={form.project_id}
            onChange={(e) =>
              setForm({ ...form, project_id: e.target.value })
            }
            className="w-full border rounded p-2"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
            className="w-full border rounded p-2"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Latitude"
              value={form.latitude}
              onChange={(e) =>
                setForm({ ...form, latitude: e.target.value })
              }
              className="border rounded p-2"
            />

            <input
              type="number"
              placeholder="Longitude"
              value={form.longitude}
              onChange={(e) =>
                setForm({ ...form, longitude: e.target.value })
              }
              className="border rounded p-2"
            />
          </div>

          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg shadow hover:opacity-90"
          >
            Select on Map
          </button>

          <input
            type="number"
            placeholder="Geofence Radius"
            value={form.geofence_radius}
            onChange={(e) =>
              setForm({ ...form, geofence_radius: e.target.value })
            }
            className="w-full border rounded p-2"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="text-slate-600">
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onSubmit(form)}
            disabled={isSubmitting}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>

    {/* Map Picker Modal */}
    <MapPickerModal
      open={mapOpen}
      onClose={() => setMapOpen(false)}
      onConfirm={({ latitude, longitude, address }) => {
        setForm((prev) => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          address: address,
        }));
      }}
    />
  </>
);

}
