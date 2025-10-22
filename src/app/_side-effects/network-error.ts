import { useGlobal } from "@/app/_global";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import React from "react";

export const useNetworkError = () => {
  const queryClient = useQueryClient();
  const { setNetworkErrorOpen } = useGlobal();
  console.log("hellllllllllllllooooooooo")

  // subscribe to query errors and add to failed queries
  React.useEffect(() => {
    const unsubscribeQueries = queryClient
      .getQueryCache()
      .subscribe((event) => {
        console.log("useNetworkError", {event})
        if (event?.type === "updated" && event.action.type == "error") {
          console.group("useNetworkError");
          const error = event.query.state.error;
          console.log({ event, error });
          if (isAxiosError(error) && error.code === "ERR_NETWORK") {
            setNetworkErrorOpen(true)
          }
          console.groupEnd()
        }
      });

    // Listen to mutation errors
    const unsubscribeMutations = queryClient
      .getMutationCache()
      .subscribe((event) => {
        console.log("useNetworkError", {event})
        if (event?.type === "updated" && event.action.type === "error") {
          console.group("useNetworkError");
          const error = event.mutation.state.error;
          console.log({ event, error });
          if (isAxiosError(error) && error.code === "ERR_NETWORK") {
            console.log("event mutation add to failed", event);
            setNetworkErrorOpen(true)
          }
          console.groupEnd()
        }
      });

    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [queryClient, setNetworkErrorOpen]);
};
