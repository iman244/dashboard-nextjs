"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PatientSessionStatus } from "./type";
import type { PatientSessionContextType } from "./type";
import { clearPatientSession, patientSnapshot, parsePatientSession, savePatientSession, subscribePatientSession } from "@/lib/patient-session";
import type { PatientTokens } from "@/lib/patient-session";
import { clearPatientRecords } from "@/lib/patient-query-cache";
import { getServerSnapshot, hydrationStore } from "./session-store";

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

  const raw = React.useSyncExternalStore(
    subscribePatientSession,
    patientSnapshot,
    getServerSnapshot
  );

  const session = React.useMemo(() => parsePatientSession(raw), [raw]);
  const nationalId = session?.nationalId ?? null;

  const clearRecords = React.useCallback(() => {
    clearPatientRecords(queryClient);
  }, [queryClient]);
  React.useEffect(() => subscribePatientSession(() => {
    if (!parsePatientSession(patientSnapshot())) clearRecords();
  }), [clearRecords]);

  const status = !isHydrated
    ? PatientSessionStatus.Loading
    : nationalId
    ? PatientSessionStatus.Authenticated
    : PatientSessionStatus.Unauthenticated;

  const signIn = React.useCallback((tokens: PatientTokens, id: string) => {
    clearRecords();
    savePatientSession(tokens, id);
  }, [clearRecords]);

  const signOut = React.useCallback(() => {
    clearPatientSession();
    clearRecords();
  }, [clearRecords]);

  const value = React.useMemo(
    () => ({ status, nationalId, sessionId: session?.id ?? null, signIn, signOut }),
    [status, nationalId, session?.id, signIn, signOut]
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
