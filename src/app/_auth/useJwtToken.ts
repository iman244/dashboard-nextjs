import React from "react";
import { AuthenticationStatus } from "./type";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/settings";
import { Mutation, useMutation, useQueryClient } from "@tanstack/react-query";
import { jwt_refresh, JWT_REFRESH_KEY } from "@/data/user/auth/jwt_refresh";
import { JwtCreateApiResponse } from "@/data/user/auth";
import { useLoadToken } from "../_side-effects/load_token";
import { useRefreshTokenSetup } from "../_side-effects/refresh_token_setup";

export const useJwtToken = ({
  setAuthenticationStatus,
}: {
  setAuthenticationStatus: React.Dispatch<
    React.SetStateAction<AuthenticationStatus>
  >;
}) => {
  const queryClient = useQueryClient();

  const [access, setAccess] = React.useState<string | null>(null);

  const [refreshSignal, setRefreshSignal] = React.useState<boolean>(false);
  const [refetchSignal, setRefetchSignal] = React.useState(false);
  const [failedQueries, setFailedQueries] = React.useState<string[]>([]);
  const [failedMutations, setFailedMutations] = React.useState<Mutation[]>([]);

  const clearAuthenticationTokens = React.useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const unauthenticateUser = React.useCallback(() => {
    console.log("unauthenticateUser called");
    clearAuthenticationTokens();
    setAccess(null);
    setAuthenticationStatus(AuthenticationStatus.Unauthenticated);
    queryClient.clear();
    queryClient.getMutationCache().clear();
  }, [clearAuthenticationTokens, queryClient, setAuthenticationStatus]);

  const storeAuthenticationTokens = React.useCallback(
    (data: JwtCreateApiResponse) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      setAccess(data.access);
    },
    [setAccess]
  );

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
      unauthenticateUser();
    },
  });

  // actions to be passed to refresh token setup side effect
  const addFailedMutations = React.useCallback(
    (mutation: Mutation) => {
      setFailedMutations((prev) => [...prev, mutation]);
    },
    [setFailedMutations]
  );

  const addFailedQueries = React.useCallback((key: string) => {
    setFailedQueries((pre) => {
      if (!pre.includes(key)) {
        return [...pre, key];
      }
      return pre;
    });
  }, []);

  // refresh token setup side effect
  useRefreshTokenSetup({ actions: { addFailedQueries, addFailedMutations } });

  // actions to be passed to load token side effect
  const saveAccessToken = React.useCallback(
    (access: string) => {
      setAccess(access);
    },
    [setAccess]
  );

  const setUserUnauthenticate = React.useCallback(() => {
    unauthenticateUser();
  }, [unauthenticateUser]);

  const signalRefreshToken = React.useCallback(() => {
    setRefreshSignal(true);
  }, [setRefreshSignal]);

  // load token side effect
  useLoadToken({
    actions: {
      saveAccessToken,
      setUserUnauthenticate,
      signalRefreshToken,
    },
  });

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
        unauthenticateUser();
      }
    }
  }, [refreshSignal, refresh_mutate, unauthenticateUser]);

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

  return { access, unauthenticateUser, storeAuthenticationTokens };
};
