import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAttendance, checkIn, checkOut } from "./services";

export const useAttendance = () => {
  const queryClient = useQueryClient();

  const attendanceQuery = useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendance,
  });

  const checkInMutation = useMutation({
    mutationFn: checkIn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });

  const checkOutMutation = useMutation({
    mutationFn: checkOut,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });

  return {
    attendanceQuery,
    checkInMutation,
    checkOutMutation,
  };
};
