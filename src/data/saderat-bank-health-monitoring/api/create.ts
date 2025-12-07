import { apiInstance } from "@/lib/api";
import { SBHM_CreateSerializer } from "../types";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

const PATH = "/saderat-bank-health-monitoring/monitorings/";

export type ApiInput = {
    payload: SBHM_CreateSerializer;
}

export const create = async ({
  payload,
}: ApiInput) => {
  const response = await apiInstance.post(PATH, payload, {
    withAuthorization: true,
  });
  return response.data;
};

export const useCreate_SBHM_API = (
  options?: Omit<
    UseMutationOptions<
      SBHM_CreateSerializer,
      AxiosError<{
        [key: string]: string[];
      }>,
      ApiInput
    >,
    "mutationFn"
  >
) => {
  return useMutation({
    mutationFn: create,
    ...options,
  });
};
