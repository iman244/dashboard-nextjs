import {
  DJANGO_ADDRESS,
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  AUTHORIZATION_TOKEN_NAME,
  DJANGO_API_PATH,
} from "@/settings";
import axios from "axios";
import { refreshOn401 } from "./refresh-on-401";

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
  setAccess: (access) => localStorage.setItem(ACCESS_TOKEN_KEY, access),
});

export { apiInstance };
