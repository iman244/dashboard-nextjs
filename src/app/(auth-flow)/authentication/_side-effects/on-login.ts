import { useAuth } from "@/app/_auth";
import { AppRoutes } from "@/app/paths";
import { JwtCreateApiResponse } from "@/data/user/auth";
import { USER_ME_KEY } from "@/data/user/fetches";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/settings";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useSWRConfig } from "swr";

export const useOnLogin = () => {
  const { loadToken } = useAuth();

  const onLogin = React.useCallback(
    (data: JwtCreateApiResponse) => {
      if (data.access) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
      }
      if (data.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
      }
      loadToken();
      // if(nextPath) {
      //   console.log("user logged in, redirecting to", nextPath);
      //   router.push(nextPath);
      // } else {
      //   console.log("user logged in, redirecting to console");
      //   router.push(AppRoutes.CONSOLE);
      // }
      // mutate(USER_ME_KEY);
    },
    [loadToken]
  );
  
  return { onLogin };
};
