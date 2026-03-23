import { useQueryClient } from "@tanstack/react-query";
import {
  useListGrievances as useGeneratedList,
  useCreateGrievance as useGeneratedCreate,
  useUpdateGrievance as useGeneratedUpdate,
  useGetGrievance as useGeneratedGet,
  useDeleteGrievance as useGeneratedDelete,
  getListGrievancesQueryKey,
  getGetGrievanceQueryKey
} from "@workspace/api-client-react";

export function useGrievances() {
  return useGeneratedList();
}

export function useGrievance(id: number) {
  return useGeneratedGet(id, { 
    query: { enabled: !!id } 
  });
}

export function useCreateGrievance() {
  const queryClient = useQueryClient();
  
  return useGeneratedCreate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGrievancesQueryKey() });
      }
    }
  });
}

export function useUpdateGrievance() {
  const queryClient = useQueryClient();
  
  return useGeneratedUpdate({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListGrievancesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetGrievanceQueryKey(data.id) });
      }
    }
  });
}

export function useDeleteGrievance() {
  const queryClient = useQueryClient();
  
  return useGeneratedDelete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGrievancesQueryKey() });
      }
    }
  });
}
