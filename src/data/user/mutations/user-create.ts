import { apiInstance } from "@/lib/api";
import { AxiosError } from "axios";

const PATH = "/auth/users/";

export const USER_CREATE_KEY = "user_create" as const;

export type UserCreateApiPayload = {
  email?: string;
  username: string;
  password: string;
};

export type UserCreateApiResponse = {
  email: string;
  username: string;
  id: number;
};

export type UserCreateApiError = AxiosError<{
  email?: string[];
  username?: string[];
  password?: string[];
}>;

export const user_create = async ({
  payload,
}: {
  payload: UserCreateApiPayload;
}) => {
  const response = await apiInstance.post(PATH, payload);
  return response.data;
};
