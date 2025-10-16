import { useAuth } from "@/app/_auth";
import { AuthenticationStatus } from "@/app/_auth/type";
import { AppRoutes } from "@/app/paths";
import { JwtCreateApiResponse } from "@/data/user/auth";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import React from "react";

export const useOnLogin = () => {
  const { AuthenticateUser, authStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const onLogin = React.useCallback(
    (data: JwtCreateApiResponse) => {
      AuthenticateUser(data);
    },
    [AuthenticateUser]
  );

  // after user is authenticated, redirect to the next path or console
  // why? because other pages check authStatus for determining if the user is authenticated or not
  React.useEffect(() => {
    if (authStatus === AuthenticationStatus.Authenticated) {
      if (nextPath) {
        console.log("user logged in, redirecting to", nextPath);
        router.push(nextPath);
      } else {
        console.log("user logged in, redirecting to console");
        router.push(AppRoutes.CONSOLE);
      }
    }
  }, [authStatus, nextPath, router]);

  return { onLogin };
};
