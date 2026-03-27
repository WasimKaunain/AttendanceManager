import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkers,
  createWorker,
  deleteWorker,
  getProjects,
  getSitesByProject
} from "./services";

export const useWorkers = (selectedProject) => {
  const queryClient = useQueryClient();

  const workersQuery = useQuery({
    queryKey: ["workers"],
    queryFn: getWorkers,
  });

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const sitesQuery = useQuery({
    queryKey: ["sites", selectedProject],
    queryFn: () => getSitesByProject(selectedProject),
    enabled: !!selectedProject,
  });

  const createMutation = useMutation({
    mutationFn: createWorker,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorker,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workers"] }),
  });

  return {
    workersQuery,
    projectsQuery,
    sitesQuery,
    createMutation,
    deleteMutation,
    refetch: workersQuery.refetch,
  };
};