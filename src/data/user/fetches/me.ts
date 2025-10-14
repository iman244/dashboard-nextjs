import { apiInstance } from "@/lib/api/django";
import { User } from "../type";

const PATH = "/auth/users/me";
export const USER_ME_KEY = "me" as const;

export const me = async () => {
  const response = await apiInstance.get<User>(PATH, {
    withAuthorization: true,
  });

  return response.data;
};
