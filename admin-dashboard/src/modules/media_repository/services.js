import api from "@/core/api/axios";

export const fetchMedia = async ({ prefix = "", search = "", token = null }) => {
  const response = await api.get("/admin/media", {
    params: {
      prefix,
      search,
      continuation_token: token
    }
  });
  return response.data;
};

export const deleteMedia = async (key) => {
  await api.delete("/admin/media", {
    params: { key }
  });
};