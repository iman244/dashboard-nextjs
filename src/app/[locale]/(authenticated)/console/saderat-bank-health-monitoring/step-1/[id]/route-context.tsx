"use client";

import { useRetrieve_SBHM_API } from "@/data/saderat-bank-health-monitoring/api/retrieve";
import { SBHM_RetrieveSerializer } from "@/data/saderat-bank-health-monitoring/types";
import { UseQueryResult } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useParams } from "next/navigation";
import React from "react";

type MonitoringIdRouteContextType = {
  monitoring_query: UseQueryResult<SBHM_RetrieveSerializer, AxiosError>;
};

const MonitoringIdRouteContext = React.createContext<
  MonitoringIdRouteContextType | undefined
>(undefined);

/**
 * `uploadId` mounts the report outside its own route (the campaign page);
 * without it the upload comes from the URL, as on the old step routes.
 */
export const MonitoringIdRouteProvider: React.FC<
  React.PropsWithChildren<{ uploadId?: number }>
> = ({ children, uploadId }) => {
  const params = useParams<{ id: string }>();
  const id = uploadId ?? parseInt(params.id);
  const monitoring_query = useRetrieve_SBHM_API({
    input: {
      pathVariables: {
        id,
      },
    },
  });

  return (
    <MonitoringIdRouteContext.Provider value={{ monitoring_query }}>
      {children}
    </MonitoringIdRouteContext.Provider>
  );
};

export const useMonitoringIdRouteContext = () => {
  const context = React.useContext(MonitoringIdRouteContext);
  if (!context) {
    throw new Error(
      "useMonitoringIdRouteContext must be used within a MonitoringIdRouteProvider"
    );
  }
  return context;
};
