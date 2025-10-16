"use client";

import React, { useEffect } from "react";
import { useAuth } from "../../_auth";
import Loading from "../../loading";
import { AuthenticationStatus } from "../../_auth/type";
import { getAuthRedirectUrl } from "../../paths";
import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

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
      <div className="flex flex-col items-center justify-center gap-4 h-screen max-w-lg mx-auto">
        <p className="text-center text-lg font-medium text-muted-foreground">
          You are not authenticated, you will be redirected to login in a few
          seconds. If you are not redirected, please click{" "}
          <Link
            href={getAuthRedirectUrl(pathname)}
            className="text-primary hover:underline"
          >
            here
          </Link>
          .
        </p>
        <Button size="lg" asChild>
          <Link href={getAuthRedirectUrl(pathname)}>Redirect to login</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default Layout;
