import { apiInstance } from "@/lib/api/django";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { User } from "../type";

const PATH = "/auth/users/me";
export const USER_ME_KEY = "me" as const;

export const me = async () => {
  const response = await apiInstance.get<User>(PATH, {
    withAuthorization: true,
  });

  return response.data;
};

export const ME_QUERY_KEY = () => [USER_ME_KEY];

export const useMe_API = (
  options?: Omit<UseQueryOptions<User>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ME_QUERY_KEY(),
    queryFn: me,
    ...options,
  });
};
