import { apiInstance } from "@/lib/api";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { SBHM_ListSerializer } from "../types";

const PATH = "/saderat-bank-health-monitoring/monitorings/";

type ApiResponse = SBHM_ListSerializer;

export const list = async () => {
  const response = await apiInstance.get<ApiResponse>(PATH, {
    withAuthorization: true,
  });
  return response.data;
};

export const LIST_SBHM_QUERY_KEY = () => [
  "saderat-bank-health-monitoring",
];
export const useList_SBHM_API = (
  options?: Omit<UseQueryOptions<ApiResponse>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: LIST_SBHM_QUERY_KEY(),
    queryFn: list,
    ...options,
  });
};
