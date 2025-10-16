"use client";

import React from "react";
import { useMutation } from "@tanstack/react-query";
import { AuthContextType, AuthenticationStatus } from "./type";
import { useJwtToken } from "./useJwtToken";
import { JwtCreateApiResponse } from "@/data/user/auth";
import { jwt_verify, JWT_VERIFY_KEY } from "@/data/user/auth/jwt_verify";

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [authStatus, setAuthenticationStatus ] = React.useState<AuthenticationStatus>(AuthenticationStatus.Loading);
  const { access, unauthenticateUser, storeAuthenticationTokens } = useJwtToken({ setAuthenticationStatus });

  const isAuthenticated = React.useMemo(
    () => authStatus === AuthenticationStatus.Authenticated,
    [authStatus]
  );

  const AuthenticateUser = React.useCallback((data: JwtCreateApiResponse) => {
    storeAuthenticationTokens(data)
    setAuthenticationStatus(AuthenticationStatus.Authenticated);
  }, [storeAuthenticationTokens]);

  // if we have access we would validate the tokens by getting user
  const { mutate: verifyAccessToken } = useMutation({
    mutationKey: [JWT_VERIFY_KEY],
    mutationFn: jwt_verify,
    onSuccess: () => {
      setAuthenticationStatus(AuthenticationStatus.Authenticated);
    },
    onError: (error) => {
      console.error("Error in token validation mutation:", error);
    },
  });

  React.useEffect(() => {
    if (access) {
      verifyAccessToken();
    }
  }, [access, verifyAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        unauthenticateUser,
        isAuthenticated,
        AuthenticateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};
