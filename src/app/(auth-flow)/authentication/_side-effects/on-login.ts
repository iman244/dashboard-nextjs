import { useAuth } from "@/app/_auth";
import { AppRoutes } from "@/app/paths";
import { JwtCreateApiResponse } from "@/data/user/auth";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

export const useOnLogin = () => {
  const { AuthenticateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const onLogin = React.useCallback(
    (data: JwtCreateApiResponse) => {
      AuthenticateUser(data);
      if(nextPath) {
        console.log("user logged in, redirecting to", nextPath);
        router.push(nextPath);
      } else {
        console.log("user logged in, redirecting to console");
        router.push(AppRoutes.CONSOLE);
      }
    },
    [AuthenticateUser, nextPath, router]
  );
  
  return { onLogin };
};
