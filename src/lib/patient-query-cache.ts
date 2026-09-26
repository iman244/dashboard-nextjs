import type { QueryClient } from "@tanstack/react-query";

/** Cancel before removing, so a late response cannot repopulate patient data. */
export function clearPatientRecords(queryClient: QueryClient) {
  void queryClient.cancelQueries({ queryKey: ["patient-own-records"] });
  queryClient.removeQueries({ queryKey: ["patient-own-records"] });
}
