import { ACCESS_TOKEN_KEY } from "@/settings";
import React from "react";

export const useLoadToken = () => {
  const [token_found, setTokenFound] = React.useState<boolean | undefined>(undefined);

  const loadToken = React.useCallback(() => {
    const access = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (access) {
      setTokenFound(true);
    } else {
      setTokenFound(false);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    loadToken();
  }, [loadToken]);

  return { token_found, loadToken };
};
