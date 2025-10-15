import { apiInstance } from "@/lib/api";
import { AxiosError } from "axios";

const PATH = "/auth/jwt/create";
export const JWT_CREATE_KEY = "jwt_create" as const;

export type JwtCreateApiPayload = {
  username: string;
  password: string;
};

export type JwtCreateApiResponse = {
  access: string;
  refresh: string;
};

export type JwtCreateApiError = AxiosError<{
  detail: "No active account found with the given credentials";
}>;

export const jwt_create = async ({
  payload,
}: {
  payload: JwtCreateApiPayload;
}) => {
  const response = await apiInstance.post<JwtCreateApiResponse>(PATH, payload);
  return response.data;
};
