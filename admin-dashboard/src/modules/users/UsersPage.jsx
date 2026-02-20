import { useState } from "react";
import { useUsers } from "./hooks";
import UserFormDialog from "./components/UserFormDialog";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom"; 

export default function UsersPage() {
  const { users, loading, addUser, editUser, removeUser } = useUsers();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  const handleCreate = async (data) => {
    await addUser(data);
  };

  const handleUpdate = async (data) => {
    await editUser(selectedUser.id, data);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await removeUser(id);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          User Management
        </h1>

        <button
          onClick={() => {
            setSelectedUser(null);
            setOpen(true);
          }}
          className="bg-black text-white px-5 py-2 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
        >
          + Create User
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02]"
            >
              {/* Username */}
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {user.username}
              </h2>

              {/* Role Badge */}
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {user.role}
              </span>

              {/* Site */}
              <p className="text-sm text-gray-500 mb-2">
                <strong>Site:</strong>{" "}
                {user.site_id ? user.site_id : "Not Assigned"}
              </p>

              {/* Status */}
              <p className="text-sm mb-4">
                <strong>Status:</strong>{" "}
                <span
                  className={`font-medium ${
                    user.status === "active"
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {user.status}
                </span>
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 transition"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-600 hover:text-red-800 transition"
                >
                  <Trash2 size={18} />
                </button>
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
    </div>
  );
}
