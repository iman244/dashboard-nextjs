import { apiInstance } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/data/api-schema";

const PATH = "/saderat-bank-health-monitoring/person-reports/";

/** One Excel upload that has rows for the person; the rows stay on the server. */
export type SBHM_PersonReport = components["schemas"]["PersonReport"];

export const listPersonReports = async (
  nationalId: string,
  monitoring?: number
) => {
  const response = await apiInstance.get<SBHM_PersonReport[]>(PATH, {
    params:
      monitoring === undefined
        ? { national_id: nationalId }
        : { national_id: nationalId, monitoring },
    withAuthorization: true,
  });
  return response.data;
};

export const PERSON_REPORTS_QUERY_KEY = (
  nationalId: string,
  monitoring?: number
) => [
  "saderat-bank-health-monitoring",
  "person-reports",
  nationalId,
  monitoring ?? "all",
];

/** Any console user reads; patient accounts get 403. */
export const useList_PersonReports_API = ({
  nationalId,
  monitoring,
  enabled = true,
}: {
  /** Ten ASCII digits. Anything else is not sent. */
  nationalId: string;
  /** Restrict to one campaign's reports; omit for every campaign. */
  monitoring?: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: PERSON_REPORTS_QUERY_KEY(nationalId, monitoring),
    queryFn: () => listPersonReports(nationalId, monitoring),
    enabled: enabled && /^\d{10}$/.test(nationalId),
  });
