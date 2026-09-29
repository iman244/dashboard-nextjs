import {
  DJANGO_ADDRESS,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  AUTHORIZATION_TOKEN_NAME,
  DJANGO_API_PATH,
} from "@/settings";
import axios from "axios";
import { refreshOn401 } from "./refresh-on-401";

/** Fired on `window` when the refresh token is refused and the session is over. */
export const SESSION_EXPIRED_EVENT = "mainreport:session-expired";

declare module "axios" {
  export interface AxiosRequestConfig {
    withAuthorization?: boolean;
  }
}

const apiInstance = axios.create({
  baseURL: DJANGO_ADDRESS + DJANGO_API_PATH,
});

apiInstance.interceptors.request.use((config) => {
  if (config.withAuthorization) {
    const access = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (access) {
      config.headers.Authorization = `${AUTHORIZATION_TOKEN_NAME} ${access}`;
    }
  }
  return config;
});

// The same endpoint `jwt_refresh` posts to; imported by value rather than
// from there, since that module imports this one.
refreshOn401(apiInstance, {
  path: "/auth/jwt/refresh",
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccess: (access) => localStorage.setItem(ACCESS_TOKEN_KEY, access),
  // useJwtToken listens, and signs the user out the way it always has.
  onRefreshFailed: () => window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT)),
});

export { apiInstance };
