import { useListCounties as useGeneratedList } from "@workspace/api-client-react";

export function useCounties() {
  return useGeneratedList({
    query: {
      staleTime: 1000 * 60 * 60, // 1 hour, static data
    }
  });
}
