import { useQuery } from "@tanstack/react-query";
import {
  getFaceLogs,
  getGeofenceLogs,
  getSystemHealth,
} from "./services";

// ======================================================
// Face Recognition Logs
// ======================================================

export function useFaceLogs(filters) {
  const logsQuery = useQuery({
    queryKey: ["face-logs", filters],
    queryFn: () => getFaceLogs(filters),
  });

  return { logsQuery };
}

// ======================================================
// Geofence Logs
// ======================================================

export function useGeofenceLogs(filters) {
  const logsQuery = useQuery({
    queryKey: ["geofence-logs", filters],
    queryFn: () => getGeofenceLogs(filters),
  });

  return { logsQuery };
}

// ======================================================
// System Health
// ======================================================

export function useSystemHealth() {
  const healthQuery = useQuery({
    queryKey: ["system-health"],
    queryFn: getSystemHealth,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return { healthQuery };
}