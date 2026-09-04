import React from "react";
import { PatientSessionProvider } from "./provider";

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <PatientSessionProvider>{children}</PatientSessionProvider>;
};

export default Layout;
