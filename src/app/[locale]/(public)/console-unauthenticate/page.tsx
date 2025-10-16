"use client";

import { getAuthRedirectUrl } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import React from "react";

const ConsoleUnauthenticate = () => {
  const pathname = usePathname();
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
};

export default ConsoleUnauthenticate;
