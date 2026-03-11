import { useState, useEffect, useMemo } from "react";
import api from "@/core/api/axios";
import { Search, ChevronDown, X, Loader2, Eye, EyeOff } from "lucide-react";

const EMPTY_FORM = {
  employee_name: "",
  email: "",
  username: "",
  password: "",
  role: "site_incharge",
  site_id: "",
  status: "active",
};

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1 ml-1">{msg}</p>;
}

export default function UserFormDialog({ open, onClose, onSubmit, initialData }) {
  const [form, setForm]           = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [sites, setSites]     = useState([]);
  const [workers, setWorkers] = useState([]);

  // worker dropdown (only for site_incharge)
  const [workerDropdownOpen, setWorkerDropdownOpen] = useState(false);
  const [workerSearch, setWorkerSearch]             = useState("");
  const [selectedWorker, setSelectedWorker]         = useState(null);

  const isAdmin       = form.role === "admin";
  const isSiteIncharge = form.role === "site_incharge";

  // Fetch sites + workers when dialog opens
  useEffect(() => {
    if (!open) return;
    Promise.all([api.get("/sites"), api.get("/workers/")])
      .then(([sR, wR]) => { setSites(sR.data); setWorkers(wR.data); })
      .catch(console.error);
  }, [open]);

  // Populate / reset form
  useEffect(() => {
    if (initialData) {
      setForm({
        employee_name: initialData.employee_name || "",
        email:         initialData.email         || "",
        username:      initialData.username       || "",
        password:      "",
        role:          initialData.role           || "site_incharge",
        site_id:       initialData.site_id        || "",
        status:        initialData.status         || "active",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setSelectedWorker(null);
    setWorkerSearch("");
    setShowPassword(false);
  }, [initialData, open]);

  // When role changes, clear fields not relevant to new role
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setForm((prev) => ({
      ...prev,
      role:          newRole,
      site_id:       "",
      email:         newRole === "site_incharge" ? "" : prev.email,
      employee_name: "",
      username:      "",
    }));
    setSelectedWorker(null);
    setWorkerSearch("");
    setErrors({});
  };

  // When email changes for admin → auto-suggest it as username
  const handleEmailChange = (e) => {
    const email = e.target.value;
    setForm((prev) => ({
      ...prev,
      email,
      // Only auto-fill username if user hasn't manually typed something else
      username: prev.username === "" || prev.username === (prev.email.split("@")[0]) 
        ? email.split("@")[0] 
        : prev.username,
    }));
    setErrors((prev) => ({ ...prev, email: undefined, username: undefined }));
  };

  const filteredWorkers = useMemo(() => {
    if (!workerSearch.trim()) return workers;
    return workers.filter(
      (w) =>
        w.full_name.toLowerCase().includes(workerSearch.toLowerCase()) ||
        w.id.toLowerCase().includes(workerSearch.toLowerCase())
    );
  }, [workers, workerSearch]);

  if (!open) return null;

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const e = {};

    if (isAdmin) {
      if (!form.employee_name.trim()) e.employee_name = "Name is required.";
      if (!form.email.trim())         e.email = "Email is required for admin.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                      e.email = "Enter a valid email address.";
    }

    if (!form.username.trim())
      e.username = "Username is required.";
    else if (form.username.trim().length < 3)
      e.username = "Username must be at least 3 characters.";

    if (!initialData && !form.password)
      e.password = "Password is required.";
    else if (form.password && form.password.length < 6)
      e.password = "Password must be at least 6 characters.";

    if (isSiteIncharge && !form.site_id)
      e.site_id = "Please select a site for Site In-Charge.";

    return e;
  };

  const handleSelectWorker = (worker) => {
    setSelectedWorker(worker);
    setForm((prev) => ({ ...prev, employee_name: worker.full_name, username: worker.id }));
    setErrors((prev) => ({ ...prev, username: undefined, employee_name: undefined }));
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
    if (isAdmin) payload.site_id = null;
    if (!isAdmin) payload.email = payload.email || null;
    if (initialData && !payload.password) delete payload.password;

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field) =>
    `w-full border p-3 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-slate-400 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 ${
      errors[field] ? "border-red-400 bg-red-50 dark:bg-red-900/20" : ""
    }`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-[480px] shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-slate-100">
          {initialData ? "Edit User" : "Create User"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* ── 1. ROLE (always first) ── */}
          <div>
            <FieldLabel>Role</FieldLabel>
            <select
              name="role"
              value={form.role}
              onChange={handleRoleChange}
              className={inputCls("role")}
            >
              <option value="admin">Admin</option>
              <option value="site_incharge">Site In-Charge</option>
            </select>
          </div>

          {/* ── 2a. ADMIN: manual name + email ── */}
          {isAdmin && (
            <>
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <input
                  name="employee_name"
                  type="text"
                  placeholder="e.g. Mohammed Al-Rashidi"
                  value={form.employee_name}
                  onChange={handleChange}
                  autoComplete="off"
                  className={inputCls("employee_name")}
                />
                <FieldError msg={errors.employee_name} />
              </div>

              <div>
                <FieldLabel>Email ID <span className="text-red-400">*</span></FieldLabel>
                <input
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={handleEmailChange}
                  autoComplete="off"
                  className={inputCls("email")}
                />
                <FieldError msg={errors.email} />
              </div>
            </>
          )}

          {/* ── 2b. SITE INCHARGE: worker dropdown for name ── */}
          {isSiteIncharge && (
            <div>
              <FieldLabel>Employee Name</FieldLabel>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setWorkerDropdownOpen(!workerDropdownOpen)}
                  className="w-full flex items-center gap-2 border dark:border-slate-600 p-3 rounded-xl text-left bg-white dark:bg-slate-700 hover:border-slate-400 transition focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-slate-400"
                >
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`flex-1 text-sm truncate ${selectedWorker ? "text-slate-800 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>
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
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b dark:border-slate-600">
                      <input
                        autoFocus
                        placeholder="Search by name or ID…"
                        value={workerSearch}
                        onChange={(e) => setWorkerSearch(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:bg-slate-600 dark:border-slate-500 dark:text-slate-100"
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
                            className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer"
                          >
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{w.full_name}</span>
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
          )}

          {/* ── 3. USERNAME ── */}
          <div>
            <FieldLabel>Username</FieldLabel>
            <input
              name="username"
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              autoComplete="off"
              className={inputCls("username")}
            />
            {isAdmin && form.email && (
              <p className="text-xs text-slate-400 mt-1 ml-1">
                Suggested from email — you can edit it.
              </p>
            )}
            <FieldError msg={errors.username} />
          </div>

          {/* ── 4. PASSWORD ── */}
          <div>
            <FieldLabel>{initialData ? "New Password (leave blank to keep)" : "Password"}</FieldLabel>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={initialData ? "New password…" : "Password"}
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                className={`${inputCls("password")} pr-12`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <FieldError msg={errors.password} />
          </div>

          {/* ── 5. SITE (only for site_incharge) ── */}
          {isSiteIncharge && (
            <div>
              <FieldLabel>Assigned Site</FieldLabel>
              <select
                name="site_id"
                value={form.site_id}
                onChange={handleChange}
                className={inputCls("site_id")}
              >
                <option value="">Select Site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
              <FieldError msg={errors.site_id} />
            </div>
          )}

          {/* ── 6. STATUS ── */}
          <div>
            <FieldLabel>Status</FieldLabel>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputCls("status")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* ── Buttons ── */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2 bg-gray-200 dark:bg-slate-600 dark:text-slate-200 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-black dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
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
