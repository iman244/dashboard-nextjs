import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isAuthFlowRoute,
  isProtectedRoute,
  AppRoutes,
  getAuthRedirectUrl,
} from "../paths";
import { User } from "@/data/user/type";

/**
 * Hook to handle authentication-based routing side effects
 * - Redirects authenticated users away from auth flow pages
 * - Redirects unauthenticated users from protected pages to login
 */
export const useAuthorized = (user: User | undefined) => {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Skip on server-side or if pathname is not available yet
    if (typeof window === "undefined" || !pathname) return;

    const isUserAuthenticated = Boolean(user);

    // if (isAuthFlowRoute(pathname)) {
    //   if (isUserAuthenticated) {
    //     console.log(
    //       "user is authenticated and on auth flow pages, redirecting to console"
    //     );
    //     router.push(AppRoutes.CONSOLE);
    //   }
    // }

    if (isProtectedRoute(pathname)) {
      if (!isUserAuthenticated) {
        const redirectUrl = getAuthRedirectUrl(pathname);
        console.log(
          "user is not authenticated and on protected pages, redirecting to auth",
          redirectUrl
        );
        router.push(redirectUrl);
      }
    }
  }, [user, router, pathname]);
};
