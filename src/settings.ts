export const DJANGO_ADDRESS =
  process.env.NEXT_PUBLIC_DJANGO_ADDRESS || "http://127.0.0.1:8000";
export const DJANGO_API_PATH =
  process.env.NEXT_PUBLIC_DJANGO_API_PATH || "/api";

export const AUTHORIZATION_TOKEN_NAME =
  process.env.NEXT_PUBLIC_AUTHORIZATION_TOKEN_NAME || "JWT";
export const ACCESS_TOKEN_KEY =
  process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || "access";
export const REFRESH_TOKEN_KEY =
  process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || "refresh";
