import { apiInstance } from "@/lib/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { PatientEntry, PatientEntry_PatchSerializer } from "../types";

const PATH = "/saderat-bank-health-monitoring/patient-entries/";

export type PatientEntryUpdateInput = {
  id: number;
  payload: PatientEntry_PatchSerializer;
};

export const update = async ({ id, payload }: PatientEntryUpdateInput) => {
  const response = await apiInstance.patch<PatientEntry>(
    `${PATH}${id}/`,
    payload,
    { withAuthorization: true }
  );
  return response.data;
};

export const useUpdate_PatientEntry_API = (
  options?: Omit<
    UseMutationOptions<
      PatientEntry,
      AxiosError<{ [key: string]: string[] }>,
      PatientEntryUpdateInput
    >,
    "mutationFn"
  >
) => useMutation({ mutationFn: update, ...options });
