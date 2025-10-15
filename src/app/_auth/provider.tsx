"use client";

import { me, USER_ME_KEY } from "@/data/user/fetches";
import React from "react";
import useSWR from "swr";
import { AuthContextType } from "./type";
import { AxiosError } from "axios";
import { useNetworkError } from "../_side-effects/network-error";
import { useLoadToken } from "../_side-effects/load_token";
import { User } from "@/data/user/type";
import { useUnAuthorized } from "../_side-effects/unauthorized";
import { useAuthorized } from "../_side-effects/authorized";

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

  // side effects
  // if user is authorized, redirect to console
  useAuthorized(data);
  // if user is unauthorized, redirect to authentication
  useUnAuthorized(error);
  // if there is a network error, show a network error dialog
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
