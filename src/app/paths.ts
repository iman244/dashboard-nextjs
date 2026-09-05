export enum AppRoutes {
  AUTHENTICATION = "/authentication",
  CONSOLE = "/console",
  LOADING = "/loading",
  PATIENT_SIGN_IN = "/patient/sign-in",
  PATIENT_RECORDS = "/patient/records",
}

// Routes that require authentication
export const PROTECTED_ROUTES = [
  AppRoutes.CONSOLE,
] as const;

// Routes that should redirect authenticated users away
export const AUTH_FLOW_ROUTES = [
  AppRoutes.AUTHENTICATION,
] as const;

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  AppRoutes.LOADING,
] as const;

/**
 * Check if a path requires authentication
 */
export const isProtectedRoute = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
};

/**
 * Check if a path is part of the authentication flow
 */
export const isAuthFlowRoute = (pathname: string): boolean => {
  return AUTH_FLOW_ROUTES.some(route => pathname.startsWith(route));
};

/**
 * Check if a path is public (doesn't require authentication)
 */
export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
};

/**
 * Get the redirect URL for authentication with next parameter
 */
export const getAuthRedirectUrl = (nextPath: string): string => {
  const nextParam = encodeURIComponent(nextPath);
  return `${AppRoutes.AUTHENTICATION}?next=${nextParam}`;
};

/**
 * Resolve the post-sign-in destination from an untrusted `?next=` parameter.
 *
 * `next` arrives from the query string, so anyone can put anything in it. Fed
 * straight to `router.push`/`<Link href>` it is an open redirect: a link like
 * `/authentication?next=https://evil.example/session-expired` shows our real
 * domain and our real sign-in form, then throws the user off-site the instant
 * their credentials are accepted — the moment they are least suspicious.
 *
 * Only a same-origin absolute path survives. `//host` is rejected too: browsers
 * read a protocol-relative URL as another origin, so it would leak just as badly.
 */
export const safeNextPath = (next: string | null | undefined): string => {
  if (!next) return AppRoutes.CONSOLE;
  if (!next.startsWith("/") || next.startsWith("//")) return AppRoutes.CONSOLE;
  return next;
};