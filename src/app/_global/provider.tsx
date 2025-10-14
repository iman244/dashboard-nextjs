"use client";

import React from "react";
import { GlobalContextType } from "./type";
import NetworkErrorDialog from "../_network-error/dialog";

const GlobalContext = React.createContext<GlobalContextType | undefined>(
  undefined
);

export const GlobalProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [networkErrorOpen, setNetworkErrorOpen] = React.useState(false);

  return (
    <GlobalContext.Provider value={{ networkErrorOpen, setNetworkErrorOpen }}>
      {children}
      <NetworkErrorDialog />
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = React.useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
};
