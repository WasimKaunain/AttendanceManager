// src/modules/data-management/services.js

import api from "@/core/api/axios";

export const fetchArchived = async (entity) => {
  const res = await api.get(`/${entity}`, {
    params: { include_deleted: true },
  });
  return res.data.filter((item) => item.is_deleted === true);
};

export const restoreEntity = async (entity, id) => {
  return await api.patch(`/${entity}/${id}/restore`);
};

export const forceDeleteEntity = async (entity, id, payload) => {
  return await api.delete(`/${entity}/${id}/force-delete`, {
    data: payload,
  });
};