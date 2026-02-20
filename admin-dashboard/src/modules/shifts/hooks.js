import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} from "./services";

export const useShifts = () => {
  const queryClient = useQueryClient();

  const shiftsQuery = useQuery({
    queryKey: ["shifts"],
    queryFn: getShifts,
  });

  const createMutation = useMutation({
    mutationFn: createShift,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  const updateMutation = useMutation({
    mutationFn: updateShift,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShift,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  return {
    shiftsQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};
