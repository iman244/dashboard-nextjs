import React from "react";
import { AuthenticationStatus } from "./type";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/settings";
import { Mutation, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { jwt_refresh, JWT_REFRESH_KEY } from "@/data/user/auth/jwt_refresh";
import { JwtCreateApiResponse } from "@/data/user/auth";

export const useJwtToken = ({
  setAuthenticationStatus,
}: {
  setAuthenticationStatus: React.Dispatch<
    React.SetStateAction<AuthenticationStatus>
  >;
}) => {
  const [access, setAccess] = React.useState<string | null>(null);

  const [refreshSignal, setRefreshSignal] = React.useState<boolean>(false);
  const [refetchSignal, setRefetchSignal] = React.useState(false);
  const [failedQueries, setFailedQueries] = React.useState<string[]>([]);
  const [failedMutations, setFailedMutations] = React.useState<Mutation[]>([]);

  const storeAuthenticationTokens = React.useCallback(
    (data: JwtCreateApiResponse) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      setAccess(data.access);
    },
    [setAccess]
  );

  const clearAuthenticationTokens = React.useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const { mutate: refresh_mutate } = useMutation({
    mutationKey: [JWT_REFRESH_KEY],
    mutationFn: jwt_refresh,
    onSuccess(data) {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      setAccess(data.access);
      setRefreshSignal(false);
      setRefetchSignal(true);
    },
    onError(error) {
      console.log("refresh_m error", error);
      unAuthenticateUser();
    },
  });

  const queryClient = useQueryClient();

  const unAuthenticateUser = React.useCallback(() => {
    console.log("unAuthenticateUser called");
    clearAuthenticationTokens();
    setAccess(null);
    setAuthenticationStatus(AuthenticationStatus.Unauthenticated);
    queryClient.clear();
    queryClient.getMutationCache().clear();
  }, [clearAuthenticationTokens, queryClient, setAuthenticationStatus]);

  // subscribe to query errors and add to failed queries
  React.useEffect(() => {
    const unsubscribeQueries = queryClient
      .getQueryCache()
      .subscribe((event) => {
        if (event?.type === "updated" && event.action.type == "error") {
          console.group("query event for error");
          const error = event.query.state.error;
          console.log({ event, error });
          if (error instanceof AxiosError && error.status === 401) {
            console.log(
              "error status is 401, query will be add to refresh queue",
              event
            );
            setFailedQueries((pre) => {
              const _key = event.query.queryKey[0];
              if (!pre.includes(_key)) {
                return [...pre, event.query.queryKey[0]];
              }
              return pre;
            });
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
          if (error instanceof AxiosError && error.status === 401) {
            console.log("event mutation add to failed", event);
            setFailedMutations((prev) => [...prev, event.mutation]);
          }
        }
      });

    return () => {
      unsubscribeQueries();
      unsubscribeMutations();
    };
  }, [queryClient, setAuthenticationStatus]);

  React.useEffect(() => {
    // after adding subscribes we trigger token_validation_query so it would authenticate or unauthenticate user
    const acc = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (acc) {
      // console.log("access token found, starting flow");
      setAccess(acc);
    } else {
      // console.log("access token did not found, user is unauthenticate");
      setAuthenticationStatus(AuthenticationStatus.Unauthenticated);
    }
  }, [setAuthenticationStatus]);

    // signal the refresh token to be refreshed if there are failed queries or mutations
    React.useEffect(() => {
      if (failedQueries.length > 0 || failedMutations.length > 0) {
        setRefreshSignal(true);
      }
    }, [failedQueries, failedMutations]);

  // start the refresh token flow when refresh signal is true
  React.useEffect(() => {
    if (refreshSignal) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        console.log("refresh tokens");
        refresh_mutate({ payload: { refresh: refreshToken } });
      } else {
        // console.log("no refresh token, user will be disprove");
        unAuthenticateUser();
      }
    }
  }, [refreshSignal, refresh_mutate, unAuthenticateUser]);

  // after getting refetch signal from refresh mutation, we would redo the failed queries or mutations
  React.useEffect(() => {
    if (refetchSignal) {
      // retry queries
      if (failedQueries.length > 0) {
        console.log(
          failedQueries.length,
          "failed quries invalidated to refetch"
        );
        queryClient.invalidateQueries({
          type: "active",
          predicate: (query) => {
            const queryKey = query.queryKey;
            if (!Array.isArray(queryKey)) return false;
            return failedQueries.some((item) => queryKey.includes(item));
          },
        });
        setFailedQueries([]);
      }

      // retry mutations
      if (failedMutations.length > 0) {
        console.log(
          failedMutations.length,
          "failed quries invalidated to refetch"
        );
        failedMutations.forEach((mutation) => {
          mutation.execute(mutation.state.variables);
        });
        setFailedMutations([]);
      }
      setRefetchSignal(false);
    }
  }, [refetchSignal, failedQueries, failedMutations, queryClient]);



  return { access, unAuthenticateUser, storeAuthenticationTokens };
};
