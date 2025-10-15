import React from "react";
import { Paths } from "../paths";
import { useRouter } from "next/navigation";
import { User } from "@/data/user/type";

export const useAuthorized = (user: User | undefined) => {
  const router = useRouter();
  React.useEffect(() => {
    if (user) {
      router.push(Paths.CONSOLE);
    }
  }, [user, router]);
};
