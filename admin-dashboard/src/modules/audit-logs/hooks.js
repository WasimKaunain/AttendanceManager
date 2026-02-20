import { useQuery } from "@tanstack/react-query";
import api from "@/core/api/axios";

export function useAuditLogs(filters) {
  const logsQuery = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      const cleanedParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== null
        )
      );

      const res = await api.get("/audit-logs/", {
        params: cleanedParams,
      });

      return res.data;
    },
  });

  return { logsQuery };
}
