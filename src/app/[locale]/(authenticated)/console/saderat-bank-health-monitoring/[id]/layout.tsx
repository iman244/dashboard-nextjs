import React from "react";
import { MonitoringIdRouteProvider } from "./route-context";

const MonitoringIdLayout: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return <MonitoringIdRouteProvider>{children}</MonitoringIdRouteProvider>;
};

export default MonitoringIdLayout;
