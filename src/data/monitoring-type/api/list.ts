import { apiInstance } from "@/lib/api";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { MonitoringType_ListSerializer } from "../types";

const PATH = "/saderat-bank-health-monitoring/monitoring-types/";

type ApiResponse = MonitoringType_ListSerializer;

export const list = async () => {
  const response = await apiInstance.get<ApiResponse>(PATH, {
    withAuthorization: true,
  });
  return response.data;
};

export const LIST_MONITORING_TYPE_QUERY_KEY = () => ["monitoring-type"];

export const useList_MonitoringType_API = (
  options?: Omit<
    UseQueryOptions<ApiResponse, AxiosError, ApiResponse>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: LIST_MONITORING_TYPE_QUERY_KEY(),
    queryFn: list,
    ...options,
  });
};
