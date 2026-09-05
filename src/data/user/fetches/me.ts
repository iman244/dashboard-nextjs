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

// Only staff may upload or delete excel datasets. Reads through the shared
// `me` query, so this costs no extra request wherever the console sidebar has
// already fetched the user. Returns false while the request is in flight or
// has failed, so the mutating controls stay hidden unless we positively know
// the user is staff.
export const useIsStaff = () => {
  const { data } = useMe_API();
  return data?.is_staff === true;
};
