import { Paths } from "@/app/paths";
import { ACCESS_TOKEN_KEY } from "@/settings";
import { useRouter } from "next/navigation";
import React from "react";

export const useLoadToken = () => {
  const [token_found, setTokenFound] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      setTokenFound(true);
    } else {
      router.push(Paths.AUTHENTICATION);
    }
  }, [router]);

  return { token_found };
};
