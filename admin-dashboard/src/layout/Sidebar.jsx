import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";

import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  Users,
  ClipboardCheck,
  Clock,
  BarChart3,
  ScrollText,
  LogOut,
  UserCog,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Projects", icon: FolderKanban, path: "/projects" },
  { name: "Sites", icon: MapPin, path: "/sites" },
  { name: "Workers", icon: Users, path: "/workers" },
  { name: "Attendance", icon: ClipboardCheck, path: "/attendance" },
  { name: "Shifts", icon: Clock, path: "/shifts" },
  { name: "Reports", icon: BarChart3, path: "/reports" },
  { name: "Audit Logs", icon: ScrollText, path: "/audit-logs" },
  { name: "Users", icon: UserCog, path: "/users", role: "admin" },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();   // 👈 IMPORTANT
  console.log("Logged in user:", user);

  const handleLogout = () => {
    logout();                     // Clear auth state
    navigate("/login");           // Redirect
  };
  
  return (
    <div className="w-64 bg-black text-gray-300 flex flex-col h-screen p-5">
      {/* Logo */}
      <div className="mb-10">
        <h1 className="text-xl font-bold text-white">SiteTrack</h1>
        <p className="text-xs text-gray-400">ATTENDANCE</p>
      </div>

      {/* Menu */}
      <div className="flex-1 space-y-2">
        {menuItems.filter((item) => {if (!item.role) return true;         // visible to all
        return user?.role === item.role;}).map((item) => {

          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 p-2 rounded-md transition ${
                isActive
                  ? "bg-gray-800 text-white"
                  : "hover:bg-gray-900"
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-gray-400 hover:text-white transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
