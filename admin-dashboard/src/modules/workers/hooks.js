import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkers,
  createWorker,
  deleteWorker,
  enrollFace,
} from "./services";

export const useWorkers = () => {
  const queryClient = useQueryClient();

  const workersQuery = useQuery({
    queryKey: ["workers"],
    queryFn: getWorkers,
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

  const enrollMutation = useMutation({
    mutationFn: enrollFace,
  });

  return {
    workersQuery,
    createMutation,
    deleteMutation,
    enrollMutation,
  };
};
