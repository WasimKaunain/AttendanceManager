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
    type: "permanent",
    daily_rate: "",
    monthly_salary: "",
    hourly_rate: "",
    daily_working_hours: "",
    ot_multiplier: "1.5",
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        daily_rate: initialData.daily_rate ?? "",
        monthly_salary: initialData.monthly_salary ?? "",
        hourly_rate: initialData.hourly_rate ?? "",
        daily_working_hours: initialData.daily_working_hours ?? "",
        ot_multiplier: initialData.ot_multiplier ?? "1.5",
      });
    }
  }, [initialData]);

  // auto-calc hourly rate when daily_rate or daily_working_hours change
  useEffect(() => {
    const dr = parseFloat(form.daily_rate);
    const dwh = parseFloat(form.daily_working_hours);
    if (!isNaN(dr) && !isNaN(dwh) && dwh > 0) {
      const hr = +(dr / dwh).toFixed(4);
      setForm((f) => ({ ...f, hourly_rate: String(hr) }));
    }
  }, [form.daily_rate, form.daily_working_hours]);

  if (!open) return null;

  const filteredSites = sites.filter(
    (s) => s.project_id === form.project_id
  );

  const validate = () => {
    const newErrors = {};

    if (!form.full_name) newErrors.full_name = "Full name is required";
    if (!form.mobile) newErrors.mobile = "Mobile number is required";
    if (!form.project_id) newErrors.project_id = "Please select project";
    if (!form.site_id) newErrors.site_id = "Please select site";

    // daily working hours required and >0
    if (!form.daily_working_hours || parseFloat(form.daily_working_hours) <= 0) {
      newErrors.daily_working_hours = "Daily working hours required and must be > 0";
    }

    if (form.type === "permanent") {
      if (!form.daily_rate) newErrors.daily_rate = "Daily rate required";
      if (!form.monthly_salary) newErrors.monthly_salary = "Monthly salary required";
    }

    if (form.type === "contract") {
      if (!form.daily_rate) newErrors.daily_rate = "Daily rate required";
      // hourly_rate will be auto-calculated from daily_rate/daily_working_hours
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit({
        ...form,
        daily_rate: parseFloat(form.daily_rate) || 0,
        monthly_salary: parseFloat(form.monthly_salary) || null,
        hourly_rate: parseFloat(form.hourly_rate) || 0,
        daily_working_hours: parseFloat(form.daily_working_hours) || 0,
        ot_multiplier: parseFloat(form.ot_multiplier) || 1,
      });

      setPopup({
        type: "success",
        message: initialData
          ? `Worker "${form.full_name}" updated successfully!`
          : `Worker "${form.full_name}" created successfully!`,
      });

      setTimeout(() => {
        setPopup(null);
        onClose();
      }, 1200);

    } catch (err) {
      let message = initialData ? "Failed to update worker." : "Failed to create worker.";
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white rounded-xl p-6 w-[520px]">

        <h2 className="text-lg font-semibold mb-4">
          {initialData ? "Edit Worker" : "New Worker"}
        </h2>

        <div className="space-y-3">

          <div>
            <input
              placeholder="Full Name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full border rounded p-2"
            />
            {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name}</p>}
          </div>

          <div>
            <input
              placeholder="Mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="w-full border rounded p-2"
            />
            {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
          </div>

          <input
            placeholder="ID Number"
            value={form.id_number}
            onChange={(e) => setForm({ ...form, id_number: e.target.value })}
            className="w-full border rounded p-2"
          />

          <div>
            <select
              value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value, site_id: "" })}
              className="w-full border rounded p-2"
            >
              <option value="">Select Project</option>
              {projects.filter((p) => p.status === "active").map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.project_id && <p className="text-red-500 text-sm">{errors.project_id}</p>}
          </div>

          <div>
            <select
              value={form.site_id}
              onChange={(e) => setForm({ ...form, site_id: e.target.value })}
              className="w-full border rounded p-2"
            >
              <option value="">Select Site</option>
              {filteredSites.filter((s) => s.status === "active").map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.site_id && <p className="text-red-500 text-sm">{errors.site_id}</p>}
          </div>

          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded p-2">
            <option value="plumber">Plumber</option>
            <option value="electrician">Electrician</option>
            <option value="fitter">Fitter</option>
            <option value="mason">Mason</option>
            <option value="laborer">Labourer</option>
            <option value="foreman">Foreman</option>
            <option value="site_manager">Site Manager</option>
            <option value="engineer">Engineer</option>
            <option value="other">Other</option>
          </select>

          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded p-2">
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
          </select>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <input type="number" placeholder="Daily Working Hours" value={form.daily_working_hours} onChange={(e) => setForm({ ...form, daily_working_hours: e.target.value })} className="w-full border rounded p-2" />
              {errors.daily_working_hours && <p className="text-red-500 text-sm">{errors.daily_working_hours}</p>}
            </div>

            {form.type === "permanent" && (
              <>
                <input type="number" placeholder="Daily Rate" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} className="w-full border rounded p-2" />
                {errors.daily_rate && <p className="text-red-500 text-sm">{errors.daily_rate}</p>}

                <input type="number" placeholder="Monthly Salary" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} className="w-full border rounded p-2" />
                {errors.monthly_salary && <p className="text-red-500 text-sm">{errors.monthly_salary}</p>}
              </>
            )}

            {form.type === "contract" && (
              <>
                <input type="number" placeholder="Daily Rate" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} className="w-full border rounded p-2" />
                {errors.daily_rate && <p className="text-red-500 text-sm">{errors.daily_rate}</p>}

                <input type="number" placeholder="OT Multiplier" value={form.ot_multiplier} onChange={(e) => setForm({ ...form, ot_multiplier: e.target.value })} className="w-full border rounded p-2" />
              </>
            )}

            {/* Hourly rate shown read-only, auto-calculated */}
            <div>
              <input type="number" placeholder="Hourly Rate (auto)" value={form.hourly_rate} readOnly className="w-full border rounded p-2 bg-gray-50" />
            </div>

          </div>

        </div>

        {popup && (
          <div className={`mt-4 p-3 rounded text-sm ${popup.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {popup.message}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="text-slate-600">Cancel</button>

          <button onClick={handleSubmit} className="bg-black text-white px-4 py-2 rounded">Save</button>
        </div>
      </div>
    </div>
  );
}