import type { QueryClient } from "@tanstack/react-query";
import { LIST_MONITORING_TYPE_QUERY_KEY } from "@/data/monitoring-type/api/list";
import { PATIENT_RECORDS_QUERY_KEY } from "./api/records";

/**
 * After a record is added, edited or deleted: the record lists, each
 * patient's records and the campaign counts. "all", not the default "active":
 * the pages that show them are often not mounted, and the app turns
 * refetchOnMount off, so a merely-stale list would come back showing the old
 * rows.
 */
export const refreshRecords = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["patient-entries"],
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: PATIENT_RECORDS_QUERY_KEY(),
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: LIST_MONITORING_TYPE_QUERY_KEY(),
      refetchType: "all",
    }),
  ]);
