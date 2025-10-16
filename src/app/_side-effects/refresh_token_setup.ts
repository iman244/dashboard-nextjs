import { Mutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import React from "react";

type Actions = {
  addFailedQueries: (key: string) => void;
  addFailedMutations: (mutation: Mutation) => void;
};

export const useRefreshTokenSetup = ({ actions }: { actions: Actions }) => {
  const queryClient = useQueryClient();
  // subscribe to query errors and add to failed queries
  React.useEffect(() => {
    const unsubscribeQueries = queryClient
      .getQueryCache()
      .subscribe((event) => {
        if (event?.type === "updated" && event.action.type == "error") {
          console.group("query event for error");
          const error = event.query.state.error;
          console.log({ event, error });
          if (isAxiosError(error) && error.status === 401) {
            console.log(
              "error status is 401, query will be add to refresh queue",
              event
            );
            actions.addFailedQueries(event.query.queryKey[0]);
          } else {
            console.log("error is not 401 so it will not add to refresh queue");
          }
          console.groupEnd();
        }
      });

    // Listen to mutation errors
    const unsubscribeMutations = queryClient
      .getMutationCache()
      .subscribe((event) => {
        if (event?.type === "updated" && event.action.type === "error") {
          const error = event.mutation.state.error;
          if (isAxiosError(error) && error.status === 401) {
            console.log("event mutation add to failed", event);
            actions.addFailedMutations(event.mutation);
          }
        }
      });

    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [queryClient, actions]);
};
