import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkers,
  createWorker,
  deleteWorker,
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
    onError: () => {}, // ensures mutateAsync re-throws the error to the caller
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorker,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["workers"] }),
  });

  return {
    workersQuery,
    createMutation,
    deleteMutation,
  };
};
