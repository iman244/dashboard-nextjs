"use client";

import React, { useEffect } from "react";
import { useAuth } from "../../_auth";
import Loading from "../../loading";
import { AuthenticationStatus } from "../../_auth/type";
import { getAuthRedirectUrl } from "../../paths";
import { usePathname, useRouter } from "@/i18n/navigation";
import ConsoleUnauthenticate from "../(public)/console-unauthenticate/page";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { authStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authStatus === AuthenticationStatus.Unauthenticated) {
      const timeout = setTimeout(() => {
        router.push(getAuthRedirectUrl(pathname));
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [authStatus, router, pathname]);

  if (authStatus === AuthenticationStatus.Loading) {
    return <Loading />;
  }

  if (authStatus === AuthenticationStatus.Unauthenticated) {
    return (
      <ConsoleUnauthenticate />
    );
  }

  return <>{children}</>;
};

export default Layout;
