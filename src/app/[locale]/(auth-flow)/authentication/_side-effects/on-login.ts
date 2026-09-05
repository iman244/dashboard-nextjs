import { useAuth } from "@/app/_auth";
import { JwtCreateApiResponse } from "@/data/user/auth";
import React from "react";

/**
 * Stores the tokens and flips auth status. That flip is the whole signal —
 * the sign-in layout above this screen watches `authStatus` and starts the
 * navigation on the same tick.
 *
 * This hook used to own a redirect of its own, in an effect keyed on
 * `authStatus`. It never ran: flipping the status makes the parent layout stop
 * rendering this subtree, so the component unmounts in the very commit that
 * would have triggered the effect. The redirect it was written to do now
 * happens in that layout, which is the one place that survives the flip.
 */
export const useOnLogin = () => {
  const { AuthenticateUser } = useAuth();

  const onLogin = React.useCallback(
    (data: JwtCreateApiResponse) => {
      AuthenticateUser(data);
    },
    [AuthenticateUser]
  );

  return { onLogin };
};
