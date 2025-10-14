import { User } from "@/data/user/type";
import { SWRResponse } from "swr";

export type AuthContextType = {
  user: SWRResponse<User>['data'];
};