"use client";

import { useAuth } from "@/app/_auth";
import Loading from "@/app/loading";
import React, { useEffect } from "react";
import { AppRoutes } from "@/app/paths";
import { AuthenticationStatus } from "@/app/_auth/type";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

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
      <div className="flex flex-col items-center justify-center gap-4 h-screen max-w-lg mx-auto">
        <p className="text-center text-lg font-medium text-muted-foreground">
          You are authenticated, you will be redirected to console in a few
          seconds. If you are not redirected, please click{" "}
          <Link href={AppRoutes.CONSOLE} className="text-primary hover:underline">here</Link>.
        </p>
        <Button asChild>
          <Link href={AppRoutes.CONSOLE}>Redirect to console</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default Layout;
