import api from "@/core/api/axios";

export const getProjects = async () => {
  const res = await api.get("/projects/");
  return res.data;
};

export const createProject = async (data) => {
  const res = await api.post("/projects/", data);
  return res.data;
};

export const updateProject = async ({ id, data }) => {
  const res = await api.put(`/projects/${id}`, data);
  return res.data;
};

export const deleteProject = async (id) => {
  await api.delete(`/projects/${id}`);
};
