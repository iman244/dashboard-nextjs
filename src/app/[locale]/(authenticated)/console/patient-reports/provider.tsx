"use client";

import React, { useContext, useState } from "react";
import { format } from "date-fns-jalali";
import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
  EHRByNationalNumberApiResponse,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { toast } from "sonner";

export type PatientReportsFormValues = {
  nationalNumber: string;
  dateRange: {
    from: Date;
    to: Date;
  } | null;
};

export type PatientReportsContextProps = {
  ehrByNationalNumber_m: UseMutationResult<
    EHRByNationalNumberApiResponse,
    Error,
    {
      params: {
        nationalNumber: string;
        fromDate: string;
        toDate: string;
        patientType: string;
      };
    }
  >;
  filters: PatientReportsFormValues;
  setFilters: (filters: PatientReportsFormValues) => void;
  hasData: boolean;
  setHasData: (hasData: boolean) => void;
};

const PatientReportsContext = React.createContext<
  PatientReportsContextProps | undefined
>(undefined);

const Provider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [filters, setFilters] = useState<PatientReportsFormValues>({
    nationalNumber: "",
    dateRange: null,
  });
  const [hasData, setHasData] = useState(false);

  // Data fetching with dynamic filters
  const ehrByNationalNumber_m = useMutation({
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY, "patient"],
    mutationFn: ehr_by_national_number,
    onSuccess: () => {
      setHasData(true);
    },
    onError: (error) => {
      console.error("Patient reports error", error);
      toast.error(error.message);
      setHasData(false);
    },
  });

  return (
    <PatientReportsContext.Provider
      value={{
        ehrByNationalNumber_m,
        filters,
        setFilters,
        hasData,
        setHasData,
      }}
    >
      {children}
    </PatientReportsContext.Provider>
  );
};

export default Provider;

export const usePatientReports = () => {
  const context = useContext(PatientReportsContext);
  if (!context) {
    throw new Error(
      "usePatientReports must be used within a PatientReportsProvider"
    );
  }
  return context;
};
