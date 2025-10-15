import { User } from "@/data/user/type";
import { SWRResponse } from "swr";

export type AuthContextType = {
  user: SWRResponse<User>['data'];
  isLoading: boolean;
  loadToken: () => void;
  token_found: boolean | undefined;
};