import api from "@/core/api/axios";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) => value !== "" && value !== null && value !== undefined
    )
  );

// ======================================================
// Face Recognition Logs
// ======================================================

export const getFaceLogs = async (params = {}) => {
  const { data } = await api.get("/diagnostics/face-logs", {
    params: cleanParams(params),
  });
  return data;
};

// ======================================================
// Geofence Logs
// ======================================================

export const getGeofenceLogs = async (params = {}) => {
  const { data } = await api.get("/diagnostics/geofence-logs", {
    params: cleanParams(params),
  });
  return data;
};

// ======================================================
// System Health
// ======================================================

export const getSystemHealth = async () => {
  const { data } = await api.get("/diagnostics/system-health");
  return data;
};