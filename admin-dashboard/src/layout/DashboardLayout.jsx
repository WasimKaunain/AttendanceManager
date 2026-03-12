import { useState } from "react";
import Sidebar from "./Sidebar";
import { pageThemes } from "@/core/theme/theme";
import { useTheme } from "@/core/theme/ThemeContext";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({ children, theme = "operational" }) {
  const { mode } = useTheme();
  const backgroundClass = pageThemes[theme][mode];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Mobile backdrop overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {/* Desktop: always visible static column */}
      {/* Mobile: fixed drawer, slides in from left */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 lg:static lg:z-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content area ── */}
      <div className={`flex-1 flex flex-col overflow-hidden ${backgroundClass} transition-all duration-500`}>

        {/* ── Mobile top navbar ── */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">SiteTrack</span>
        </div>

        {/* ── Page content ── */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}