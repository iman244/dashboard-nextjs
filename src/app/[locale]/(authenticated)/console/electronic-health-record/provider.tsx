"use client";

import React, { useContext, useState } from "react";
import { EHRFilterState } from "./type";

export type ElectronicHealthRecordContextProps = {
  filters: EHRFilterState;
  setFilters: (filters: EHRFilterState) => void;
};

const ElectronicHealthRecordContext = React.createContext<
  ElectronicHealthRecordContextProps | undefined
>(undefined);

const Provider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [filters, setFilters] = useState<EHRFilterState>({
    nationalNumber: "",
    fromDate: "",
    toDate: "",
    patientType: "",
  });

  return (
    <ElectronicHealthRecordContext.Provider value={{ filters, setFilters }}>
      {children}
    </ElectronicHealthRecordContext.Provider>
  );
};

export default Provider;

export const useElectronicHealthRecord = () => {
  const context = useContext(ElectronicHealthRecordContext);
  if (!context) {
    throw new Error(
      "useElectronicHealthRecord must be used within a ElectronicHealthRecordProvider"
    );
  }
  return context;
};
