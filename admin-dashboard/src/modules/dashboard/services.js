import api from "@/core/api/axios";

export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const getWeeklyAttendance = async () => {
  const response = await api.get("/dashboard/weekly-attendance");
  return response.data;
};

export const getRecentActivity = async () => {
  const response = await api.get("/dashboard/recent-activity");
  return response.data;
};
