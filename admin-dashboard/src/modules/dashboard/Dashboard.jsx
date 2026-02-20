import { useEffect, useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import StatCard from "./components/StatCard";
import WeeklyChart from "./components/WeeklyChart";
import TodayStatus from "./components/TodayStatus";

import {
  FolderKanban,
  MapPin,
  Users,
  UserCheck,
} from "lucide-react";

import {
  getDashboardStats,
  getWeeklyAttendance,
  getRecentActivity,
} from "./services";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

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
        <div className="p-8 text-slate-500">Loading dashboard...</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="p-8 min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm">
            Overview of projects, workforce and attendance
          </p>
        </div>

        {/* TOP STATS */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={FolderKanban}
          />
          <StatCard
            title="Active Sites"
            value={stats.activeSites}
            icon={MapPin}
          />
          <StatCard
            title="Total Workers"
            value={stats.totalWorkers}
            icon={Users}
          />
          <StatCard
            title="Present Today"
            value={stats.presentToday}
            icon={UserCheck}
          />
        </div>

        {/* MIDDLE SECTION */}
        <div className="grid grid-cols-3 gap-6">

          {/* WEEKLY CHART */}
          <div
            className="col-span-2 backdrop-blur-xl bg-white/60
                       border border-white/40
                       shadow-xl rounded-3xl p-6"
          >
            <WeeklyChart data={weeklyData} />
          </div>

          {/* TODAY STATUS */}
          <div
            className="backdrop-blur-xl bg-white/60
                       border border-white/40
                       shadow-xl rounded-3xl p-6"
          >
            <TodayStatus data={stats.todayStatus} />
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div
          className="backdrop-blur-xl bg-white/60
                     border border-white/40
                     shadow-xl rounded-3xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">
            Recent Attendance Activity
          </h2>

          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">
              No recent activity available.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl bg-white/50 hover:bg-white/70 transition"
                >
                  <p className="text-sm text-slate-700">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
