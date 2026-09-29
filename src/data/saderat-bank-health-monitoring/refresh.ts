import type { QueryClient } from "@tanstack/react-query";
import { LIST_MONITORING_TYPE_QUERY_KEY } from "@/data/monitoring-type/api/list";
import { LIST_SBHM_QUERY_KEY } from "./api/list";
import { ALL_PERSON_REPORTS_QUERY_KEY } from "./api/person-reports";

/**
 * After an upload is added or deleted: the uploads list, the campaign counts
 * and every person's reports. "all", not the default "active": the pages that
 * show them are often not mounted, and the app turns refetchOnMount off, so a
 * merely-stale list would come back showing the old uploads. Resolves once the
 * refetches settle, so a caller can navigate onto fresh data.
 */
export const refreshUploads = (queryClient: QueryClient) =>
  Promise.all([
    // exact: the list key is also the prefix of each upload's own rows, which
    // have not changed (and a deleted upload's would only answer 404).
    queryClient.invalidateQueries({
      queryKey: LIST_SBHM_QUERY_KEY(),
      exact: true,
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: LIST_MONITORING_TYPE_QUERY_KEY(),
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: ALL_PERSON_REPORTS_QUERY_KEY(),
      refetchType: "all",
    }),
  ]);
