import { useState, useEffect } from "react";

export default function WorkerFormDialog({
  open,
  onClose,
  onSubmit,
  projects,
  sites,
  initialData,
}) {
  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    id_number: "",
    project_id: "",
    site_id: "",
    role: "laborer",
    daily_rate: "",
    status: "active",
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  if (!open) return null;

  const filteredSites = sites.filter(
    (s) => s.project_id === form.project_id
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[500px]">
        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Worker" : "New Worker"}
        </h2>

        <div className="space-y-3">
          <input
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({ ...form, full_name: e.target.value })
            }
            className="w-full border rounded p-2"
          />

          <input
            placeholder="Mobile"
            value={form.mobile}
            onChange={(e) =>
              setForm({ ...form, mobile: e.target.value })
            }
            className="w-full border rounded p-2"
          />

          <input
            placeholder="ID Number"
            value={form.id_number}
            onChange={(e) =>
              setForm({ ...form, id_number: e.target.value })
            }
            className="w-full border rounded p-2"
          />

          <select
            value={form.project_id}
            onChange={(e) =>
              setForm({
                ...form,
                project_id: e.target.value,
                site_id: "",
              })
            }
            className="w-full border rounded p-2"
          >
            <option value="">Select Project</option>
            {projects.filter((p) => p.status === "active").map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={form.site_id}
            onChange={(e) =>
              setForm({ ...form, site_id: e.target.value })
            }
            className="w-full border rounded p-2"
          >
            <option value="">Select Site</option>
            {filteredSites.filter((s) => s.status === "active").map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
            className="w-full border rounded p-2"
          >
            <option value="plumber">Plumber</option>
            <option value="electrician">Electrician</option>
            <option value="fitter">Fitter</option>
            <option value="mason">Mason</option>
            <option value="laborer">Labourer</option>
            <option value="other">Other</option>
          </select>
          
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value })
            }
            className="w-full border rounded p-2"
          >
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
          </select>

          {form.type === "permanent" && (
            <>
              <input
                type="number"
                placeholder="Daily Rate"
                value={form.daily_rate}
                onChange={(e) =>
                  setForm({ ...form, daily_rate: e.target.value })
                }
                className="w-full border rounded p-2"
              />

              <input
                type="number"
                placeholder="Monthly Salary"
                value={form.monthly_salary}
                onChange={(e) =>
                  setForm({ ...form, monthly_salary: e.target.value })
                }
                className="w-full border rounded p-2"
              />
            </>
          )}

          {form.type === "contract" && (
            <>
              <input
                type="number"
                placeholder="Hourly Rate"
                value={form.hourly_rate}
                onChange={(e) =>
                  setForm({ ...form, hourly_rate: e.target.value })
                }
                className="w-full border rounded p-2"
              />
          
              <input
                type="number"
                placeholder="Daily Rate"
                value={form.daily_rate}
                onChange={(e) =>
                  setForm({ ...form, daily_rate: e.target.value })
                }
                className="w-full border rounded p-2"
              />
            </>
          )}


        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="text-slate-600">
            Cancel
          </button>
          <button
            onClick={() =>
              onSubmit({
                ...form,
                daily_rate: parseFloat(form.daily_rate),
              })
            }
            className="bg-black text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
