import { AppRoutes } from "@/app/paths";
import { ACCESS_TOKEN_KEY } from "@/settings";
import { AxiosError, isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import React from "react";

export const useUnAuthorized = (error: AxiosError | undefined) => {
  const router = useRouter();
  React.useEffect(() => {
    if (isAxiosError(error)) {
      if (error.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        router.push(AppRoutes.AUTHENTICATION);
      }
    }
  }, [error, router]);
};
