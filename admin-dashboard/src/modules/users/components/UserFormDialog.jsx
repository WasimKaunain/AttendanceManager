import { useState, useEffect } from "react";
import api from "@/core/api/axios";

export default function UserFormDialog({open,onClose,onSubmit,initialData,}) 
{
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "site_manager",
    site_id: "",
    status: "active",
  });

  const [sites, setSites] = useState([]);

  // 🔹 Fetch Sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await api.get("/sites");
        setSites(res.data);
      } catch (err) {
        console.error("Error fetching sites:", err);
      }
    };

    if (open) fetchSites();
  }, [open]);

  // 🔹 Populate Edit Mode
  useEffect(() => {
    if (initialData) {
      setForm({
        username: initialData.username || "",
        password: "",
        role: initialData.role || "site_manager",
        site_id: initialData.site_id || "",
        status: initialData.status || "active",
      });
    }
  }, [initialData]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    const payload = { ...form };
  
    // If admin → remove site_id
    if (payload.role === "admin") {
      payload.site_id = null;
    }
  
    // If edit mode and password empty → remove it
    if (initialData && !payload.password) {
      delete payload.password;
    }
  
    onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-3xl w-[450px] shadow-2xl transform transition-all">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {initialData ? "Edit User" : "Create User"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none"
            required
          />

          {/* Password */}
          <input
            name="password"
            type="password"
            placeholder={initialData ? "New Password (leave blank to keep current)" : "Password"}
            value={form.password}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none"
            required={!initialData}
          />

          {/* Role */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none"
          >
            <option value="admin">Admin</option>
            <option value="site_manager">Site Manager</option>
          </select>

          {/* Site Dropdown (Only if site_manager) */}
          {form.role === "site_manager" && (
            <select
              name="site_id"
              value={form.site_id}
              onChange={handleChange}
              className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none"
              required
            >
              <option value="">Select Site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          )}

          {/* Status */}
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-black outline-none"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-black text-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
