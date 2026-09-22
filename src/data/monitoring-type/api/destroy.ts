import { apiInstance } from "@/lib/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { MonitoringType_InUseError } from "../types";

type PathVariables = {
  id: number;
};

export type MonitoringTypeDestroyInput = {
  pathVariables: PathVariables;
};

const PATH = ({ id }: PathVariables) =>
  `/saderat-bank-health-monitoring/monitoring-types/${id}/`;

export const destroy = async ({ pathVariables }: MonitoringTypeDestroyInput) => {
  const response = await apiInstance.delete<void>(PATH(pathVariables), {
    withAuthorization: true,
  });
  return response.data;
};

export const useDestroy_MonitoringType_API = (
  options?: Omit<
    // The error body is typed as the 409 shape rather than DRF's usual field
    // arrays: a type that reports still point at is the expected failure here,
    // not an edge case, and the caller needs `monitorings` off it.
    UseMutationOptions<void, AxiosError<MonitoringType_InUseError>, MonitoringTypeDestroyInput>,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: destroy,
    ...options,
  });
};
