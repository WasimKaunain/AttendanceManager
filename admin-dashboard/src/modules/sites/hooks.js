import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSites,
  createSite,
  updateSite,
  deleteSite,
  getProjects,
} from "./services";

export const useSites = () => {
  const queryClient = useQueryClient();

  const sitesQuery = useQuery({
    queryKey: ["sites"],
    queryFn: getSites,
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const createMutation = useMutation({
    mutationFn: createSite,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sites"] }),
  });

  const updateMutation = useMutation({
    mutationFn: updateSite,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sites"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSite,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["sites"] }),
  });

  return {
    sitesQuery,
    projectsQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};
