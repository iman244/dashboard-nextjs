import { useGlobal } from "@/app/_global";
import { AxiosError, isAxiosError } from "axios";
import React from "react";

export const useNetworkError = (error: AxiosError | undefined) => {
  const { setNetworkErrorOpen } = useGlobal();
  React.useEffect(() => {
    if (isAxiosError(error)) {
      if (error.code === "ERR_NETWORK") {
        setNetworkErrorOpen(true);
      }
    }
  }, [error, setNetworkErrorOpen]);
};
