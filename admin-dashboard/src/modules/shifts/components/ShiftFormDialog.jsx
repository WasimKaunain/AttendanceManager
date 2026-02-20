import { useState, useEffect } from "react";

export default function ShiftFormDialog({
  open,
  onClose,
  projects,
  initialData,
  onSubmit,
  isSubmitting,
}) {
  const [form, setForm] = useState({
    name: "",
    start_time: "",
    end_time: "",
    grace_period_minutes: 15,
    overtime_threshold_hours: 8,
    project_id: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[450px] p-6">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Shift" : "New Shift"}
        </h2>

        <div className="space-y-3">
          <input
            placeholder="Shift Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full border rounded p-2"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm({
                  ...form,
                  start_time: e.target.value,
                })
              }
              className="border rounded p-2"
            />
            <input
              type="time"
              value={form.end_time}
              onChange={(e) =>
                setForm({
                  ...form,
                  end_time: e.target.value,
                })
              }
              className="border rounded p-2"
            />
          </div>

          <input
            type="number"
            placeholder="Grace Period (minutes)"
            value={form.grace_period_minutes}
            onChange={(e) =>
              setForm({
                ...form,
                grace_period_minutes: e.target.value,
              })
            }
            className="w-full border rounded p-2"
          />

          <input
            type="number"
            placeholder="Overtime After (hours)"
            value={form.overtime_threshold_hours}
            onChange={(e) =>
              setForm({
                ...form,
                overtime_threshold_hours: e.target.value,
              })
            }
            className="w-full border rounded p-2"
          />

          <select
            value={form.project_id}
            onChange={(e) =>
              setForm({
                ...form,
                project_id: e.target.value,
              })
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
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose}>
            Cancel
          </button>

          <button
            onClick={() => onSubmit(form)}
            disabled={isSubmitting}
            className="bg-black text-white px-4 py-2 rounded"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
