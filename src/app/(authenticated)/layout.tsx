"use client";

import React from "react";
import { useAuth } from "../_auth";
import Loading from "../loading";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Loading />;
  }

  return <>{children}</>;
};

export default Layout;
