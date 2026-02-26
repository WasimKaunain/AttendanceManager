import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/core/auth/AuthContext";
import { useTheme } from "@/core/theme/ThemeContext";
import { Moon, Sun } from "lucide-react";

import {LayoutDashboard,FolderKanban,MapPin,Users,ClipboardCheck,Clock,BarChart3,LogOut,UserCog,} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Projects", icon: FolderKanban, path: "/projects" },
  { name: "Sites", icon: MapPin, path: "/sites" },
  { name: "Workers", icon: Users, path: "/workers" },
  { name: "Attendance", icon: ClipboardCheck, path: "/attendance" },
  // { name: "Shifts", icon: Clock, path: "/shifts" },
  { name: "Reports", icon: BarChart3, path: "/reports" },
  { name: "Administration", icon: UserCog, path: "/administration", role: "admin" },
];

export default function Sidebar() {
  const { mode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();   // 👈 IMPORTANT
  console.log("Logged in user:", user);

  const sidebarBg =
  mode === "dark"
    ? "bg-slate-950 text-slate-300"
    : "bg-slate-900 text-slate-300";

  const handleLogout = () => {logout(); navigate("/login");};
  
  return (
    <div className={`relative w-64 ${sidebarBg} flex flex-col h-screen p-5`}>

      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">SiteTrack</h1>
          <p className="text-xs text-gray-400">ATTENDANCE</p>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-800 transition"
        >
          {mode === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 space-y-2">
        {menuItems.filter((item) => {if (!item.role) return true;         // visible to all
        return item.role ? user?.role === item.role : true;}).map((item) => {

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
