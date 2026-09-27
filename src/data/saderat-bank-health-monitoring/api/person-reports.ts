import { apiInstance } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { components } from "@/data/api-schema";

const PATH = "/saderat-bank-health-monitoring/person-reports/";

/** One Excel upload that has rows for the person; the rows stay on the server. */
export type SBHM_PersonReport = components["schemas"]["PersonReport"];

export const listPersonReports = async (nationalId: string) => {
  const response = await apiInstance.get<SBHM_PersonReport[]>(PATH, {
    params: { national_id: nationalId },
    withAuthorization: true,
  });
  return response.data;
};

export const PERSON_REPORTS_QUERY_KEY = (nationalId: string) => [
  "saderat-bank-health-monitoring",
  "person-reports",
  nationalId,
];

/** Staff only: the endpoint answers 403 to anyone else, so gate on `enabled`. */
export const useList_PersonReports_API = ({
  nationalId,
  enabled = true,
}: {
  /** Ten ASCII digits. Anything else is not sent. */
  nationalId: string;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: PERSON_REPORTS_QUERY_KEY(nationalId),
    queryFn: () => listPersonReports(nationalId),
    enabled: enabled && /^\d{10}$/.test(nationalId),
  });
