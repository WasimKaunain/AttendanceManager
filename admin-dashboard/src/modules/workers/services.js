import api from "@/core/api/axios";

export const getWorkers = async () => {
  const res = await api.get("/workers/");
  return res.data;
};

export const createWorker = async (data) => {
  const res = await api.post("/workers/", data);
  return res.data;
};

export const deleteWorker = async (id) => {
  await api.delete(`/workers/${id}`);
};

export const enrollFace = async ({ id, file }) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(
    `/workers/${id}/enroll-face`,
    formData
  );
  return res.data;
};
