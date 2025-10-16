"use client";

import React, { useEffect } from "react";
import { useAuth } from "../_auth";
import Loading from "../loading";
import { AuthenticationStatus } from "../_auth/type";
import { getAuthRedirectUrl } from "../paths";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { authStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authStatus === AuthenticationStatus.Unauthenticated) {
      router.push(getAuthRedirectUrl(pathname));
    }
  }, [authStatus, router, pathname]);

  if (authStatus === AuthenticationStatus.Loading) {
    return <Loading />;
  }

  if (authStatus === AuthenticationStatus.Unauthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
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
          {" "}
          <Link href={getAuthRedirectUrl(pathname)}>Redirect to login</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default Layout;
