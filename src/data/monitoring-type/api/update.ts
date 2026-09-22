import { apiInstance } from "@/lib/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { MonitoringType, MonitoringType_PatchSerializer } from "../types";

type PathVariables = {
  id: number;
};

export type MonitoringTypeUpdateInput = {
  pathVariables: PathVariables;
  payload: MonitoringType_PatchSerializer;
};

const PATH = ({ id }: PathVariables) =>
  `/saderat-bank-health-monitoring/monitoring-types/${id}/`;

export const update = async ({ pathVariables, payload }: MonitoringTypeUpdateInput) => {
  // PATCH, not PUT: the payload type has every field optional, so a form that
  // sends only what the user touched cannot blank the rest by omission.
  const response = await apiInstance.patch<MonitoringType>(
    PATH(pathVariables),
    payload,
    { withAuthorization: true }
  );
  return response.data;
};

export const useUpdate_MonitoringType_API = (
  options?: Omit<
    UseMutationOptions<
      MonitoringType,
      AxiosError<{ [key: string]: string[] }>,
      MonitoringTypeUpdateInput
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: update,
    ...options,
  });
};
