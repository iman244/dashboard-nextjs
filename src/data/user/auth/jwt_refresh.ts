import { apiInstance } from "@/lib/api";

const PATH = "/auth/jwt/refresh";
export const JWT_REFRESH_KEY = "jwt_refresh" as const;

export type JwtRefreshApiPayload = {
  refresh: string;
};

export type JwtRefreshApiResponse = {
  access: string;
};

export const jwt_refresh = async ({
  payload,
}: {
  payload: JwtRefreshApiPayload;
}) => {
  const response = await apiInstance.post<JwtRefreshApiResponse>(PATH, payload);
  return response.data;
};
