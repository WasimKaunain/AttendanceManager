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
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  if (!open) return null;

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Site name is required";
    if (!form.project_id) newErrors.project_id = "Please select a project";
    if (!form.latitude) newErrors.latitude = "Latitude is required";
    if (!form.longitude) newErrors.longitude = "Longitude is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit(form);

      setPopup({
        type: "success",
        message: initialData
          ? `Site "${form.name}" updated successfully!`
          : `Site "${form.name}" created successfully!`,
      });

      setTimeout(() => {
        setPopup(null);
        onClose();
      }, 2000);
    } catch (err) {
      let message = initialData ? "Failed to update site." : "Failed to create site.";

      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          message = detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
        } else {
          message = String(detail);
        }
      } else if (err?.message) {
        message = err.message;
      }

      setPopup({ type: "error", message });
    }
  };

  return (
  <>
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[420px] p-6">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Site" : "New Site"}
        </h2>

        <div className="space-y-3">
          <div>
            <input
              placeholder="Site Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded p-2"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full border rounded p-2"
            >
              <option value="">Select Project</option>
              {projects
                .filter((p) => p.status === "active")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
              ))}
            </select>
            {errors.project_id && <p className="text-red-500 text-sm">{errors.project_id}</p>}
          </div>

          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border rounded p-2"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                placeholder="Latitude"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="border rounded p-2 w-full"
              />
              {errors.latitude && <p className="text-red-500 text-sm">{errors.latitude}</p>}
            </div>
            <div>
              <input
                type="number"
                placeholder="Longitude"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="border rounded p-2 w-full"
              />
              {errors.longitude && <p className="text-red-500 text-sm">{errors.longitude}</p>}
            </div>
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
            onChange={(e) => setForm({ ...form, geofence_radius: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>

        {popup && (
          <div
            className={`mt-4 p-3 rounded text-sm ${
              popup.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {popup.message}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="text-slate-600">
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>

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
