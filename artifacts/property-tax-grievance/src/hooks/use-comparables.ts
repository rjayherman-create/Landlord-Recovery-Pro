import { useQueryClient } from "@tanstack/react-query";
import {
  useListComparables as useGeneratedList,
  useAddComparable as useGeneratedAdd,
  useDeleteComparable as useGeneratedDelete,
  getListComparablesQueryKey
} from "@workspace/api-client-react";

export function useComparables(grievanceId: number) {
  return useGeneratedList(
    { grievanceId },
    { query: { enabled: !!grievanceId } }
  );
}

export function useAddComparable(grievanceId: number) {
  const queryClient = useQueryClient();
  
  return useGeneratedAdd({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ 
          queryKey: getListComparablesQueryKey({ grievanceId }) 
        });
      }
    }
  });
}

export function useDeleteComparable(grievanceId: number) {
  const queryClient = useQueryClient();
  
  return useGeneratedDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ 
          queryKey: getListComparablesQueryKey({ grievanceId }) 
        });
      }
    }
  });
}
