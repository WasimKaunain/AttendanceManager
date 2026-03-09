import api from "@/core/api/axios";

export const getWorkers = async () => {
  const res = await api.get("/workers/");
  return res.data;
};

export const createWorker = async (data) => {
  try 
  {
    const res = await api.post("/workers/", data);
    return res.data;
  } catch (err) 
  {
    console.error("Error creating worker:", err);
    throw err;
  }
};

export const deleteWorker = async (id) => {
  await api.delete(`/workers/${id}`);
};


