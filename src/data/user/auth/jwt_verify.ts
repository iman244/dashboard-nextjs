import { apiInstance } from "@/lib/api";
import { ACCESS_TOKEN_KEY } from "@/settings";

const PATH = "/auth/jwt/verify";
export const JWT_VERIFY_KEY = "jwt_verify" as const;

export type JwtVerifyApiPayload = {
  token: string;
};

export const jwt_verify = async () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const response = await apiInstance.post(PATH, { token });
  return response.data;
};
