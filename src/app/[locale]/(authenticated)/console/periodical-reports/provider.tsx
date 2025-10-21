"use client";

import React, { useContext, useState, useEffect } from "react";
import { parseISO } from "date-fns-jalali";
import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
  EHRByNationalNumberApiResponse,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

export type PeriodicalReportsFormValues = {
  dateRange: {
    from: Date;
    to: Date;
  } | null;
};

export type PeriodicalReportsContextProps = {
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
  filters: PeriodicalReportsFormValues;
  setFilters: (filters: PeriodicalReportsFormValues) => void;
  hasData: boolean;
  setHasData: (hasData: boolean) => void;
};

const PeriodicalReportsContext = React.createContext<
  PeriodicalReportsContextProps | undefined
>(undefined);

const Provider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [filters, setFilters] = useState<PeriodicalReportsFormValues>({
    dateRange: null,
  });
  const [hasData, setHasData] = useState(false);

  // Data fetching with dynamic filters
  const ehrByNationalNumber_m = useMutation({
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY, "periodical"],
    mutationFn: ehr_by_national_number,
    onSuccess: () => {
      setHasData(true);
    },
    onError: (error) => {
      console.error("Periodical reports error", error);
      toast.error(error.message);
      setHasData(false);
    },
  });

  React.useEffect(() => {
    console.log("ehrByNationalNumber_m.status", ehrByNationalNumber_m.status);
    console.log("ehrByNationalNumber_m.data", ehrByNationalNumber_m.data);
  }, [ehrByNationalNumber_m]);

  return (
    <PeriodicalReportsContext.Provider
      value={{
        ehrByNationalNumber_m,
        filters,
        setFilters,
        hasData,
        setHasData,
      }}
    >
      {children}
    </PeriodicalReportsContext.Provider>
  );
};

export default Provider;

export const usePeriodicalReports = () => {
  const context = useContext(PeriodicalReportsContext);
  if (!context) {
    throw new Error(
      "usePeriodicalReports must be used within a PeriodicalReportsProvider"
    );
  }
  return context;
};
