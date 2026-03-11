import { useState, useEffect } from "react";
import { useUsers } from "./hooks";
import UserFormDialog from "./components/UserFormDialog";
import { Pencil, Trash2, ArrowLeft, CheckCircle2, XCircle, X, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layout/DashboardLayout";
import PageHeader from "@/shared/components/PageHeader";
import { useAuth } from "@/core/auth/AuthContext";

// ── Toast ──────────────────────────────────────────────
function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium pointer-events-auto transition-all duration-300
            ${t.type === "success"
              ? "bg-green-50 dark:bg-green-900/80 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900/80 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200"}`}
        >
          {t.type === "success"
            ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Delete Confirm Dialog ──────────────────────────────
function DeleteConfirmDialog({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-[380px] shadow-2xl text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-2">Delete User?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This action cannot be undone. The user will be permanently removed.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2 bg-gray-100 dark:bg-slate-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-medium"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function UsersPage() {
  const { users, sitesMap, loading, addUser, editUser, removeUser } = useUsers();
  const { user: currentUser } = useAuth();   // logged-in admin's own profile
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const navigate = useNavigate();

  // For a card that is an admin: only show Edit if it's the logged-in admin themselves
  const canEdit = (cardUser) => {
    if (cardUser.role !== "admin") return true;          // site incharges — always editable
    return cardUser.id === currentUser?.id;              // admin — only own card
  };

  const toggleReveal = (id) =>
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleCreate = async (data) => {
    try {
      await addUser(data);
      setOpen(false);
      showToast("User created successfully!", "success");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to create user.";
      showToast(typeof msg === "string" ? msg : msg[0]?.msg || "Failed to create user.", "error");
    }
  };

  const handleUpdate = async (data) => {
    try {
      await editUser(selectedUser.id, data);
      setOpen(false);
      showToast("User updated successfully!", "success");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to update user.";
      showToast(typeof msg === "string" ? msg : msg[0]?.msg || "Failed to update user.", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await removeUser(deleteTargetId);
      setDeleteTargetId(null);
      showToast("User deleted successfully!", "success");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to delete user.";
      showToast(typeof msg === "string" ? msg : msg[0]?.msg || "Failed to delete user.", "error");
      setDeleteTargetId(null);
    }
  };

  return (
    <DashboardLayout theme="administration">
    <div className="p-8 min-h-screen space-y-6">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex justify-between items-center">
        <PageHeader
          title="User Management"
          subtitle="Create and manage system users and roles"
        />
        <button
          onClick={() => { setSelectedUser(null); setOpen(true); }}
          className="bg-black text-white px-5 py-2 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
        >
          + Create User
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-slate-500 dark:text-slate-400">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-slate-400 dark:text-slate-500 text-center mt-20">No users found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02]"
            >
              {/* Employee Name */}
              {user.employee_name && (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-0.5 uppercase tracking-wide">
                  {user.employee_name}
                </p>
              )}
              {/* Username */}
              <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100 mb-2">{user.username}</h2>

              {/* Role Badge */}
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 ${
                user.role === "admin"
                  ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                  : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              }`}>
                {user.role === "admin" ? "Admin" : "Site In-Charge"}
              </span>

              {/* Site */}
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                <strong>Site:</strong>{" "}
                {user.site_id ? (sitesMap[user.site_id] || user.site_id) : "Not Assigned"}
              </p>

              {/* Status */}
              <p className="text-sm dark:text-slate-300 mb-2">
                <strong>Status:</strong>{" "}
                <span className={`font-medium ${user.status === "active" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                  {user.status}
                </span>
              </p>

              {/* Password — site_incharge only */}
              {user.role !== "admin" && (
                <div className="flex items-center gap-2 text-sm dark:text-slate-300 mb-4">
                  <strong>Password:</strong>
                  {user.plain_password ? (
                    <>
                      <span className="font-mono tracking-widest text-gray-700 dark:text-slate-200 select-all">
                        {revealedPasswords[user.id] ? user.plain_password : "••••••••"}
                      </span>
                      <button
                        onClick={() => toggleReveal(user.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition ml-1"
                        title={revealedPasswords[user.id] ? "Hide password" : "Reveal password"}
                      >
                        {revealedPasswords[user.id]
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-amber-500 dark:text-amber-400 italic">
                      Reset password to record it here
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t dark:border-slate-700">
                {/* Edit — admins can only edit their own profile */}
                {canEdit(user) ? (
                  <button
                    onClick={() => { setSelectedUser(user); setOpen(true); }}
                    className="text-blue-600 hover:text-blue-800 transition"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                ) : (
                  <Pencil
                    size={18}
                    className="text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    title="You cannot edit another admin's profile"
                  />
                )}
                {/* Delete is disabled for admin users */}
                {user.role !== "admin" && (
                  <button
                    onClick={() => setDeleteTargetId(user.id)}
                    className="text-red-600 hover:text-red-800 transition"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <UserFormDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={selectedUser ? handleUpdate : handleCreate}
        initialData={selectedUser}
      />

      <DeleteConfirmDialog
        open={!!deleteTargetId}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
    </DashboardLayout>
  );
}
