import { UserCreateApiResponse } from "@/data/user/mutations";
import { useRouter } from "@/i18n/navigation";
import React from "react";

export const useOnRegister = () => {
  const router = useRouter();

  const onRegister = React.useCallback(
    (data: UserCreateApiResponse) => {
      console.log("Registration successful:", data);
      // After successful registration, redirect to login page
      // or you could automatically log them in
      router.push("/authentication");
    },
    [router]
  );
  
  return { onRegister };
};
