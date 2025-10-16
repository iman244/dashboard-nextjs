import { JwtCreateApiResponse } from "@/data/user/auth";

export enum AuthenticationStatus {
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
  Loading = "loading",
}

export type AuthContextType = {
  authStatus: AuthenticationStatus;
  unauthenticateUser: () => void;
  isAuthenticated: boolean;
  AuthenticateUser: (data: JwtCreateApiResponse) => void;
};