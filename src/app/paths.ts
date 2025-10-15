export enum AppRoutes {
  AUTHENTICATION = "/authentication",
  CONSOLE = "/console",
  LOADING = "/loading",
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