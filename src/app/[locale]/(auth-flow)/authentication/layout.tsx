"use client";

import { useAuth } from "@/app/_auth";
import Loading from "@/app/loading";
import React, { useEffect, useRef, useState } from "react";
import { AuthenticationStatus } from "@/app/_auth/type";
import { safeNextPath } from "@/app/paths";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

/**
 * Gate for the sign-in screen.
 *
 * This used to hold an authenticated user on a "you are authenticated" notice
 * for a hard-coded 3000ms before navigating. Measured, that notice was 3.12s of
 * a frozen screen out of a 3.5s transition — and it pre-empted the correct,
 * delay-free redirect in `_side-effects/on-login`, which could never run because
 * flipping `authStatus` unmounted the component that owned it. There is no
 * interstitial now: the navigation starts on the tick the status flips.
 */
const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { authStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // `next` is attacker-controllable; `safeNextPath` keeps it same-origin.
  const destination = safeNextPath(searchParams.get("next"));

  // Did the user sign in on this screen, or arrive already authenticated? Both
  // navigate immediately, but they want different frames while that runs: the
  // first should keep watching their own sign-in card settle, the second must
  // never be shown a sign-in form they don't need.
  //
  // The signal is whether the form was ever on screen during this mount. This is
  // React's documented "adjust state during render" pattern rather than a ref —
  // reading a ref while rendering is unsafe under the React Compiler, and the
  // lint rule that says so is right.
  const [sawSignInForm, setSawSignInForm] = useState(
    authStatus === AuthenticationStatus.Unauthenticated
  );
  if (!sawSignInForm && authStatus === AuthenticationStatus.Unauthenticated) {
    setSawSignInForm(true);
  }

  // Guarded by a ref rather than the dep list: `router` is not guaranteed to be
  // referentially stable, and re-issuing the navigation on every render pass is
  // how the old implementation logged the same redirect seven times.
  const navigated = useRef(false);

  useEffect(() => {
    if (authStatus !== AuthenticationStatus.Authenticated) return;
    if (navigated.current) return;
    navigated.current = true;
    // `replace`, not `push`. Pushing left the sign-in screen in history behind
    // the console, so Back landed on a page that immediately threw the user
    // forward again — a loop with no exit.
    router.replace(destination);
  }, [authStatus, destination, router]);

  if (authStatus === AuthenticationStatus.Loading) {
    return <Loading />;
  }

  // Arrived already signed in — a stale bookmark, a second tab, Back. Never
  // show them a sign-in form; the replace above is already in flight.
  if (authStatus === AuthenticationStatus.Authenticated && !sawSignInForm) {
    return <Loading />;
  }

  // Otherwise they signed in right here, so `children` is their own card with
  // the submit button still in its busy state. That card is the transition.

  return <>{children}</>;
};

export default Layout;
