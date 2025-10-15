import { JwtCreateApiResponse } from "@/data/user/auth";
import { useRouter } from "next/navigation";
import React from "react";

export const useOnLogin = () => {
  const router = useRouter();

  const onLogin = React.useCallback(
    (data: JwtCreateApiResponse) => {
      if (data.access) {
        localStorage.setItem("access_token", data.access);
      }
      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh);
      }
      router.push("/console");
    },
    [router]
  );
  
  return { onLogin };
};
