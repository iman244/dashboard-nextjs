import { ACCESS_TOKEN_KEY } from "@/settings";
import React from "react";

export const useLoadToken = () => {
  const [token_found, setTokenFound] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      setTokenFound(true);
    }
  }, []);

  return { token_found };
};
