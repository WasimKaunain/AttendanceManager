import { useState, useEffect } from "react";

export default function ProjectFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    client_name: "",
    status: "active",
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-96 p-6">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Project" : "New Project"}
        </h2>

        <div className="space-y-3">
          <input
            name="name"
            placeholder="Project Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />

          <input
            name="code"
            placeholder="Project Code"
            value={form.code}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />

          <input
            name="client_name"
            placeholder="Client Name"
            value={form.client_name}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600"
          >
            Cancel
          </button>

          <button
            disabled={isSubmitting}
            onClick={() => onSubmit(form)}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
