import { useState, useEffect, useMemo } from "react";
import api from "@/core/api/axios";
import { Search, ChevronDown, X, Loader2 } from "lucide-react";

const EMPTY_FORM = {
  employee_name: "",
  username: "",
  password: "",
  role: "site_incharge",
  site_id: "",
  status: "active",
};

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1 ml-1">{msg}</p>;
}

export default function UserFormDialog({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [sites, setSites] = useState([]);
  const [workers, setWorkers] = useState([]);

  const [workerDropdownOpen, setWorkerDropdownOpen] = useState(false);
  const [workerSearch, setWorkerSearch] = useState("");
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Fetch sites + workers when dialog opens
  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      try {
        const [sitesRes, workersRes] = await Promise.all([
          api.get("/sites"),
          api.get("/workers/"),
        ]);
        setSites(sitesRes.data);
        setWorkers(workersRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [open]);

  // Populate / reset form
  useEffect(() => {
    if (initialData) {
      setForm({
        employee_name: initialData.employee_name || "",
        username: initialData.username || "",
        password: "",
        role: initialData.role || "site_incharge",
        site_id: initialData.site_id || "",
        status: initialData.status || "active",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setSelectedWorker(null);
    setWorkerSearch("");
  }, [initialData, open]);

  // Filter workers by search
  const filteredWorkers = useMemo(() => {
    if (!workerSearch.trim()) return workers;
    return workers.filter(
      (w) =>
        w.full_name.toLowerCase().includes(workerSearch.toLowerCase()) ||
        w.id.toLowerCase().includes(workerSearch.toLowerCase())
    );
  }, [workers, workerSearch]);

  if (!open) return null;

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!form.username.trim())
      e.username = "Username is required.";
    else if (form.username.trim().length < 3)
      e.username = "Username must be at least 3 characters.";

    if (!initialData && !form.password)
      e.password = "Password is required.";
    else if (form.password && form.password.length < 6)
      e.password = "Password must be at least 6 characters.";

    if (form.role === "site_incharge" && !form.site_id)
      e.site_id = "Please select a site for Site In-Charge.";

    return e;
  };

  const handleSelectWorker = (worker) => {
    setSelectedWorker(worker);
    setForm((prev) => ({ ...prev, employee_name: worker.full_name, username: worker.id }));
    setErrors((prev) => ({ ...prev, username: undefined }));
    setWorkerDropdownOpen(false);
    setWorkerSearch("");
  };

  const handleClearWorker = () => {
    setSelectedWorker(null);
    setForm((prev) => ({ ...prev, employee_name: "", username: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = { ...form };
    if (payload.role === "admin" || !payload.site_id) payload.site_id = null;
    if (initialData && !payload.password) delete payload.password;

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-3xl w-[460px] shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {initialData ? "Edit User" : "Create User"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* ── Employee Name ── */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Employee Name
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setWorkerDropdownOpen(!workerDropdownOpen)}
                className="w-full flex items-center gap-2 border p-3 rounded-xl text-left bg-white hover:border-slate-400 transition focus:outline-none focus:ring-2 focus:ring-black"
              >
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <span className={`flex-1 text-sm truncate ${selectedWorker ? "text-slate-800" : "text-slate-400"}`}>
                  {selectedWorker
                    ? `${selectedWorker.full_name} (${selectedWorker.id})`
                    : "Select employee…"}
                </span>
                {selectedWorker ? (
                  <X
                    className="w-4 h-4 text-slate-400 hover:text-red-500 transition shrink-0"
                    onClick={(e) => { e.stopPropagation(); handleClearWorker(); }}
                  />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {workerDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b">
                    <input
                      autoFocus
                      placeholder="Search by name or ID…"
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredWorkers.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No employees found</p>
                    ) : (
                      filteredWorkers.map((w) => (
                        <div
                          key={w.id}
                          onClick={() => handleSelectWorker(w)}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                        >
                          <span className="text-sm font-medium text-slate-700">{w.full_name}</span>
                          <span className="text-xs text-slate-400 font-mono">{w.id}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {selectedWorker && (
              <p className="text-xs text-slate-400 mt-1 ml-1">
                Username auto-filled from Employee ID — you can edit it below.
              </p>
            )}
          </div>

          {/* ── Username ── */}
          <div>
            <input
              name="username"
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              autoComplete="off"
              className={`w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none ${errors.username ? "border-red-400 bg-red-50" : ""}`}
            />
            <FieldError msg={errors.username} />
          </div>

          {/* ── Password ── */}
          <div>
            <input
              name="password"
              type="password"
              placeholder={initialData ? "New Password (leave blank to keep)" : "Password"}
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              className={`w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none ${errors.password ? "border-red-400 bg-red-50" : ""}`}
            />
            <FieldError msg={errors.password} />
          </div>

          {/* ── Role ── */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none"
          >
            <option value="admin">Admin</option>
            <option value="site_incharge">Site In-Charge</option>
          </select>

          {/* ── Site ── */}
          {form.role === "site_incharge" && (
            <div>
              <select
                name="site_id"
                value={form.site_id}
                onChange={handleChange}
                className={`w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none ${errors.site_id ? "border-red-400 bg-red-50" : ""}`}
              >
                <option value="">Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
              <FieldError msg={errors.site_id} />
            </div>
          )}

          {/* ── Status ── */}
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* ── Buttons ── */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

