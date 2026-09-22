import { apiInstance } from "@/lib/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";

const PATH = "/saderat-bank-health-monitoring/patient-entries/";

export type PatientEntryDestroyInput = { id: number };

export const destroy = async ({ id }: PatientEntryDestroyInput) => {
  await apiInstance.delete(`${PATH}${id}/`, { withAuthorization: true });
};

export const useDestroy_PatientEntry_API = (
  options?: Omit<
    UseMutationOptions<
      void,
      AxiosError<{ detail?: string }>,
      PatientEntryDestroyInput
    >,
    "mutationFn"
  >
) => useMutation({ mutationFn: destroy, ...options });
