import { ACCESS_TOKEN_KEY } from "@/settings";
import React from "react";

export const useLoadToken = () => {
  const [AccessTokenFound, setAccessTokenFound] = React.useState<boolean | undefined>(undefined);

  const loadAccessToken = React.useCallback(() => {
    const access = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (access) {
      console.log("access token found");
      setAccessTokenFound(true);
    } else {
      console.log("access token not found");
      setAccessTokenFound(false);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    loadAccessToken();
  }, [loadAccessToken]);

  return { AccessTokenFound, loadAccessToken };
};
