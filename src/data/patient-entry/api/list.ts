import { apiInstance } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { PatientEntry } from "../types";

const PATH = "/saderat-bank-health-monitoring/patient-entries/";

export type PatientEntryListInput = {
  monitoring: number;
  nationalId?: string;
};

export const list = async ({
  monitoring,
  nationalId,
}: PatientEntryListInput) => {
  const response = await apiInstance.get<PatientEntry[]>(PATH, {
    params: {
      monitoring,
      ...(nationalId ? { national_id: nationalId } : {}),
    },
    withAuthorization: true,
  });
  return response.data;
};

export const useList_PatientEntry_API = (input: PatientEntryListInput) =>
  useQuery({
    queryKey: ["patient-entries", input.monitoring, input.nationalId ?? null],
    queryFn: () => list(input),
    enabled: Boolean(input.monitoring),
  });
