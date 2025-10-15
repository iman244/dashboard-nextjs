"use client";

import { useAuth } from "@/app/_auth";
import Loading from "@/app/loading";
import React from "react";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { token_found } = useAuth();

  if (token_found === undefined) {
    return <Loading />;
  }

  return <>{children}</>;
};

export default Layout;
