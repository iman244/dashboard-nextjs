"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "../../_auth";
import Loading from "../../loading";
import { AuthenticationStatus } from "../../_auth/type";
import { getAuthRedirectUrl } from "../../paths";
import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Gate for every authenticated route.
 *
 * The mirror of the sign-in gate: this used to park a signed-out user on a
 * "you are not authenticated" notice for a hard-coded 3000ms — the same stall,
 * paid on every logout and every expired session. Nothing waits now.
 */
const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { authStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Same ref guard as the sign-in gate: fire the navigation once, not once per
  // render pass, since `router` is not guaranteed to be referentially stable.
  const navigated = useRef(false);

  useEffect(() => {
    if (authStatus !== AuthenticationStatus.Unauthenticated) return;
    if (navigated.current) return;
    navigated.current = true;
    // `replace` so the protected URL does not stay in history behind sign-in.
    // The path travels along as `?next=`, so signing back in returns the user
    // to where they were — including after an explicit logout, which is why
    // the logout control no longer navigates on its own. One owner, no race.
    router.replace(getAuthRedirectUrl(pathname));
  }, [authStatus, router, pathname]);

  if (authStatus === AuthenticationStatus.Loading) {
    return <Loading />;
  }

  if (authStatus === AuthenticationStatus.Unauthenticated) {
    // Never a frame of console chrome for a signed-out user, and never a
    // dead-end notice either — the redirect above is already in flight.
    return <Loading />;
  }

  return <>{children}</>;
};

export default Layout;
