import api from "@/core/api/axios";

export const getSites = async () => { const res = await api.get("/sites/"); return res.data; };

export const createSite = async (data) => { const res = await api.post("/sites/", data); return res.data; };

export const updateSite = async ({ id, data }) => { const res = await api.patch(`/sites/${id}`, data); return res.data; };

export const deleteSite = async (id) => { await api.delete(`/sites/${id}`); };

export const getProjects = async () => { const res = await api.get("/projects/"); return res.data; };

export const getSiteById = async (id) => { const res = await api.get(`/sites/${id}`); return res.data;};

export const getWorkers = async () => { const res = await api.get("/workers/"); return res.data; };

export const getSiteAttendance = async ({site_id,worker_id,start_date,end_date,}) => 
  {
  const res = await api.get("/attendance", {params: { site_id, worker_id, start_date, end_date },});
  return res.data;
};

export const archiveSite = async ({ id, payload }) => { return api.patch(`/sites/${id}/archive`, payload); };

export const toggleSiteStatus = async ({ id, status }) => { return api.patch(`/sites/${id}`, { status }); };

export const getTimezoneFromCoords = async ({ lat, lng }) => { const res = await api.get("/timezone/detect", {params: { lat, lng }});return res.data;};

export const getAllTimezones = async () => {const res = await api.get("/timezone/list");return res.data.timezones;};