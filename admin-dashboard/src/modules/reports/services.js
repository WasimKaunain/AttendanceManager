import axios from "@/core/api/axios";

export const generateReport = async (payload) => {
  const response = await axios.post(
    "/reports/generate",
    payload,
    { responseType: "blob" }
  );

  return response.data;
};
