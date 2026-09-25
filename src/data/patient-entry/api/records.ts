import { apiInstance } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { PatientRecord } from "../types";

const PATH = "/saderat-bank-health-monitoring/patient-records/";

export type PatientRecordsInput = {
  /** Ten ASCII digits. Anything else is not sent. */
  nationalId: string;
  /**
   * Send the staff token. Staff pages do, so they are not rate-limited. The
   * patient portal must not: it has no Django session, and an expired token
   * left in the browser would turn an anonymous read into a 401.
   */
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
    enabled: /^\d{10}$/.test(input.nationalId),
  });
