import { apiInstance } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { PatientRecord } from "../types";

const PATH = "/saderat-bank-health-monitoring/patient-records/";

export type PatientRecordsInput = {
  /** Ten ASCII digits. Anything else is not sent. */
  nationalId: string;
  /** Staff pages send the staff token; the patient portal uses /me/. */
  authorized: boolean;
};

export const listPatientRecords = async ({
  nationalId,
  authorized,
}: PatientRecordsInput) => {
  const response = await apiInstance.get<PatientRecord[]>(PATH, {
    params: { national_id: nationalId },
    withAuthorization: authorized,
  });
  return response.data;
};

export const PATIENT_RECORDS_QUERY_KEY = (nationalId?: string) =>
  nationalId ? ["patient-records", nationalId] : ["patient-records"];

export const useList_PatientRecord_API = (input: PatientRecordsInput) =>
  useQuery({
    queryKey: PATIENT_RECORDS_QUERY_KEY(input.nationalId),
    queryFn: () => listPatientRecords(input),
    enabled: input.authorized && /^\d{10}$/.test(input.nationalId),
  });
