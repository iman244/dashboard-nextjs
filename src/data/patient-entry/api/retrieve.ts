import { apiInstance } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { PatientEntry } from "../types";

const PATH = "/saderat-bank-health-monitoring/patient-entries/";

export const retrieve = async (id: number) => {
  const response = await apiInstance.get<PatientEntry>(`${PATH}${id}/`, {
    withAuthorization: true,
  });
  return response.data;
};

export const useRetrieve_PatientEntry_API = (id: number) =>
  useQuery({
    queryKey: ["patient-entry", id],
    queryFn: () => retrieve(id),
    enabled: Number.isFinite(id),
  });
