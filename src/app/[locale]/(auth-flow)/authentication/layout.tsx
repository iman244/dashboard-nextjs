"use client";

import { useAuth } from "@/app/_auth";
import Loading from "@/app/loading";
import React, { useEffect } from "react";
import { AppRoutes } from "@/app/paths";
import { AuthenticationStatus } from "@/app/_auth/type";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import AuthAuthenticated from "@/app/[locale]/(public)/auth-authenticated/page";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { authStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  useEffect(() => {
    if (authStatus === AuthenticationStatus.Authenticated) {
      console.log(
        "user is authenticated, redirecting to",
        nextPath || AppRoutes.CONSOLE
      );
      const timeout = setTimeout(() => {
        router.push(nextPath || AppRoutes.CONSOLE);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [authStatus, router, nextPath]);

  if (authStatus === AuthenticationStatus.Loading) {
    return <Loading />;
  }

  if (authStatus === AuthenticationStatus.Authenticated) {
    console.log(
      "user is authenticated, redirecting to",
      nextPath || AppRoutes.CONSOLE
    );
    return (
      <AuthAuthenticated />
    );
  }

  return <>{children}</>;
};

export default Layout;
