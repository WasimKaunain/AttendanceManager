import api from "@/core/api/axios";

export const getAttendance = async () => {
  const res = await api.get("/attendance/");
  return res.data;
};

export const checkIn = async (formData) => {
  const res = await api.post("/attendance/check-in", formData);
  return res.data;
};

export const checkOut = async (formData) => {
  const res = await api.post("/attendance/check-out", formData);
  return res.data;
};
