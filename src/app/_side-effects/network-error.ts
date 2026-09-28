import { useGlobal } from "@/app/_global";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import React from "react";

export const useNetworkError = () => {
  const queryClient = useQueryClient();
  const { setNetworkErrorOpen } = useGlobal();

  // subscribe to query errors and add to failed queries
  React.useEffect(() => {
    const unsubscribeQueries = queryClient
      .getQueryCache()
      .subscribe((event) => {
        if (event?.type === "updated" && event.action.type == "error") {
          const error = event.query.state.error;
          // Queries that show their own inline error opt out (see
          // `src/react-query.d.ts`), so one unreachable service does not
          // cover a page whose other sections still work.
          if (isAxiosError(error) && error.code === "ERR_NETWORK" && !event.query.meta?.silentNetworkError) {
            setNetworkErrorOpen(true)
          }
        }
      });

    // Listen to mutation errors
    const unsubscribeMutations = queryClient
      .getMutationCache()
      .subscribe((event) => {
        if (event?.type === "updated" && event.action.type === "error") {
          const error = event.mutation.state.error;
          if (isAxiosError(error) && error.code === "ERR_NETWORK") {
            setNetworkErrorOpen(true)
          }
        }
      });

    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [queryClient, setNetworkErrorOpen]);
};
