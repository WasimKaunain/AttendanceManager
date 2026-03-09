import { useState, useEffect } from "react";

export default function ProjectFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
}) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    client_name: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({ name: "", code: "", client_name: "", description: "" });
    }
    setErrors({});
    setPopup(null);
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Project name is required";
    if (!form.client_name) newErrors.client_name = "Client name is required";
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
          ? `Project "${form.name}" updated successfully!`
          : `Project "${form.name}" created successfully!`,
      });

      setTimeout(() => {
        setPopup(null);
        onClose();
      }, 2000);
    } catch (err) {
      let message = initialData ? "Failed to update project." : "Failed to create project.";

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[500px] p-6">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Project" : "New Project"}
        </h2>

        <div className="space-y-3">
          <div>
            <input
              name="name"
              placeholder="Project Name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <input
            name="code"
            placeholder="Project Code"
            value={form.code}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />

          <div>
            <input
              name="client_name"
              placeholder="Client Name"
              value={form.client_name}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
            {errors.client_name && <p className="text-red-500 text-sm">{errors.client_name}</p>}
          </div>

          <textarea
            name="description"
            placeholder="Description (optional)"
            value={form.description || ""}
            onChange={handleChange}
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
          <button onClick={onClose} className="px-4 py-2 text-slate-600">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
