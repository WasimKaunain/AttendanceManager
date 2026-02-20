import api from "@/core/api/axios";

export const getShifts = async () => {
  const res = await api.get("/shifts/");
  return res.data;
};

export const createShift = async (data) => {
  const res = await api.post("/shifts/", data);
  return res.data;
};

export const updateShift = async ({ id, data }) => {
  const res = await api.put(`/shifts/${id}`, data);
  return res.data;
};

export const deleteShift = async (id) => {
  await api.delete(`/shifts/${id}`);
};
