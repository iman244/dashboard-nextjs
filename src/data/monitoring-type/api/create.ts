import { apiInstance } from "@/lib/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  MonitoringType,
  MonitoringType_CreateSerializer,
} from "../types";

const PATH = "/saderat-bank-health-monitoring/monitoring-types/";

export type MonitoringTypeCreateInput = {
  payload: MonitoringType_CreateSerializer;
};

export const create = async ({ payload }: MonitoringTypeCreateInput) => {
  const response = await apiInstance.post<MonitoringType>(PATH, payload, {
    withAuthorization: true,
  });
  return response.data;
};

export const useCreate_MonitoringType_API = (
  options?: Omit<
    UseMutationOptions<
      MonitoringType,
      // Per-field arrays, the shape DRF uses for validation errors -- a
      // duplicate slug arrives as { slug: ["... already exists."] } and the
      // form puts it on the field it belongs to.
      AxiosError<{ [key: string]: string[] }>,
      MonitoringTypeCreateInput
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: create,
    ...options,
  });
};
