import { apiInstance } from "@/lib/api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { PatientEntry, PatientEntry_CreateSerializer } from "../types";

const PATH = "/saderat-bank-health-monitoring/patient-entries/";

export type PatientEntryCreateInput = {
  payload: PatientEntry_CreateSerializer;
};

export const create = async ({ payload }: PatientEntryCreateInput) => {
  const response = await apiInstance.post<PatientEntry>(PATH, payload, {
    withAuthorization: true,
  });
  return response.data;
};

export const useCreate_PatientEntry_API = (
  options?: Omit<
    UseMutationOptions<
      PatientEntry,
      // DRF's per-field arrays, plus the 409 body, which carries the id of the
      // entry that already exists so the caller can offer to open it.
      AxiosError<{ detail?: string; id?: number } & Record<string, string[]>>,
      PatientEntryCreateInput
    >,
    "mutationFn"
  >
) => useMutation({ mutationFn: create, ...options });
