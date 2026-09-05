"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PatientSessionStatus } from "./type";
import type { PatientSessionContextType } from "./type";
import {
  clearStoredNationalId,
  getServerSnapshot,
  getSnapshot,
  hydrationStore,
  setStoredNationalId,
  subscribe,
} from "./session-store";

const PatientSessionContext = React.createContext<
  PatientSessionContextType | undefined
>(undefined);

export const PatientSessionProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  const isHydrated = React.useSyncExternalStore(
    hydrationStore.subscribe,
    hydrationStore.getSnapshot,
    hydrationStore.getServerSnapshot
  );

  const nationalId = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const status = !isHydrated
    ? PatientSessionStatus.Loading
    : nationalId
    ? PatientSessionStatus.Authenticated
    : PatientSessionStatus.Unauthenticated;

  const signIn = React.useCallback((id: string) => {
    setStoredNationalId(id);
  }, []);

  const signOut = React.useCallback(() => {
    clearStoredNationalId();
    // A second patient on the same device must not inherit the first one's
    // rows. Mirrors `unauthenticateUser` in src/app/_auth/useJwtToken.ts.
    queryClient.clear();
    queryClient.getMutationCache().clear();
  }, [queryClient]);

  const value = React.useMemo(
    () => ({ status, nationalId, signIn, signOut }),
    [status, nationalId, signIn, signOut]
  );

  return (
    <PatientSessionContext.Provider value={value}>
      {children}
    </PatientSessionContext.Provider>
  );
};

export const usePatientSession = () => {
  const context = React.useContext(PatientSessionContext);
  if (!context) {
    throw new Error(
      "usePatientSession must be used within a PatientSessionProvider"
    );
  }
  return context;
};
