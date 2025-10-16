import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/settings";
import React from "react";

type Actions = {
  saveAccessToken: (access: string) => void;
  setUserUnauthenticate: () => void;
  signalRefreshToken: () => void;
};

export const useLoadToken = ({
  actions,
}: { actions: Actions }) => {
  React.useEffect(() => {
    // after adding subscribes we trigger token_validation_query so it would authenticate or unauthenticate user
    const acc = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (acc) {
      // console.log("access token found, starting flow");
      actions.saveAccessToken(acc);
    } else if (!acc && refresh) {
      actions.signalRefreshToken();
    } else if (!acc && !refresh) {
      // console.log("access token did not found, user is unauthenticate");
      actions.setUserUnauthenticate();
    }
  }, [actions]);
};
