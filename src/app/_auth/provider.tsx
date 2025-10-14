"use client";

import { me, USER_ME_KEY } from "@/data/user/fetches";
import React from "react";
import useSWR from "swr";
import { AuthContextType } from "./type";
import { AxiosError } from "axios";
import { useNetworkError } from "./side_effects/network-error";
import { useLoadToken } from "./side_effects/load_token";
import { User } from "@/data/user/type";
import { useUnAuthorized } from "./side_effects/unauthorized";

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { token_found } = useLoadToken();
  const { data, error } = useSWR<User, AxiosError>(
    token_found ? USER_ME_KEY : null,
    me,
    {
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  useUnAuthorized(error);
  useNetworkError(error);

  return (
    <AuthContext.Provider value={{ user: data }}>
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
