import {
  DJANGO_ADDRESS,
  ACCESS_TOKEN_KEY,
  AUTHORIZATION_TOKEN_NAME,
  DJANGO_API_PATH,
} from "@/settings";
import axios from "axios";

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

export { apiInstance };
