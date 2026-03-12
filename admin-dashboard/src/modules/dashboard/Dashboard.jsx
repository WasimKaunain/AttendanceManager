import { useEffect, useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import StatCard from "./components/StatCard";
import WeeklyChart from "./components/WeeklyChart";
import TodayStatus from "./components/TodayStatus";
import PageHeader from "@/shared/components/PageHeader";
import { FolderKanban, MapPin, Users, UserCheck, LogIn, LogOut, Clock, AlertCircle } from "lucide-react";
import { getDashboardStats, getWeeklyAttendance, getRecentActivity } from "./services";

// -----------------------------------
// Status badge config
// -----------------------------------
const STATUS_CONFIG = {
  present:  { label: "Present",  bg: "bg-green-100",  text: "text-green-700"  },
  absent:   { label: "Absent",   bg: "bg-red-100",    text: "text-red-600"    },
  leave:    { label: "On Leave", bg: "bg-blue-100",   text: "text-blue-600"   },
  late:     { label: "Late",     bg: "bg-yellow-100", text: "text-yellow-700" },
};

function ActivityRow({ item, index }) {
  const cfg = STATUS_CONFIG[item.status] || { label: item.status, bg: "bg-slate-100", text: "text-slate-600" };
  const hasCheckout = !!item.check_out_time;

  return (
    <div className="flex items-start gap-3 p-3 md:p-4 rounded-2xl bg-white/60 dark:bg-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-700/70 border border-white/40 dark:border-slate-600/40 transition-all duration-200">
      {/* Index badge */}
      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {index + 1}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Worker name + status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{item.worker_name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
          {item.is_late && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-50 text-yellow-600 border border-yellow-200">
              ⚠ Late
            </span>
          )}
        </div>

        {/* Site + date */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          📍 {item.site_name}
          {item.checkout_site_name && item.checkout_site_name !== item.site_name && (
            <span className="text-slate-400 dark:text-slate-500"> → {item.checkout_site_name}</span>
          )}
          <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
          {item.date}
        </p>

        {/* Check-in / Check-out times — stacks on very small screens */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <LogIn className="w-3 h-3" />
            {item.check_in_time ?? "—"}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <LogOut className="w-3 h-3" />
            {hasCheckout ? (
              <span className="text-red-500 dark:text-red-400">{item.check_out_time}</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 italic">Not checked out</span>
            )}
          </span>
          {item.total_hours != null && (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock className="w-3 h-3" />
              {item.total_hours}h
            </span>
          )}
        </div>
      </div>

      {/* Worker ID chip — hidden on small screens */}
      <span className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0 mt-0.5">{item.worker_id}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await getDashboardStats();
        const weekly = await getWeeklyAttendance();
        const recent = await getRecentActivity();
        setStats(statsData);
        setWeeklyData(weekly);
        setRecentActivity(recent);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };

    fetchData();
  }, []);

  if (!stats)
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8 text-slate-500">Loading dashboard...</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      {/* On mobile: normal scroll. On desktop: fixed height with internal scrolling */}
      <div className="p-4 md:p-6 flex flex-col gap-4 md:gap-5 min-h-screen lg:h-screen lg:overflow-hidden">

        <PageHeader
          title="Dashboard"
          subtitle="Overview of projects, workforce and attendance"
        />

        {/* TOP STATS — 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 shrink-0">
          <StatCard title="Active Projects" value={stats.activeProjects} icon={FolderKanban} />
          <StatCard title="Active Sites"    value={stats.activeSites}    icon={MapPin}       />
          <StatCard title="Active Workers"  value={stats.totalWorkers}   icon={Users}        />
          <StatCard title="Present Today"   value={stats.presentToday}   icon={UserCheck}    />
        </div>

        {/* MIDDLE SECTION — stacked on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 shrink-0">
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 shadow-xl rounded-3xl p-4 md:p-6">
            <WeeklyChart data={weeklyData} />
          </div>
          <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 shadow-xl rounded-3xl p-4 md:p-6 overflow-hidden">
            <TodayStatus data={stats.todayStatus} />
          </div>
        </div>

        {/* BOTTOM SECTION — recent activity */}
        <div className="flex-1 min-h-0 backdrop-blur-xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/40 shadow-xl rounded-3xl p-4 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div>
              <h2 className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-100">Recent Attendance Activity</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Latest 5 check-in/out records across all sites</p>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3">
              <AlertCircle className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No attendance records yet</p>
              <p className="text-xs">Recent check-ins and check-outs will appear here.</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
              {recentActivity.map((item, index) => (
                <ActivityRow key={index} item={item} index={index} />
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
