"use client";

import React, { useContext, useState } from "react";
import { FormValues } from "./_components/ehr-filter";
import { format } from "date-fns-jalali";
import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
  EHRByNationalNumberApiResponse,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { digitsEnToFa, digitsFaToEn } from "@persian-tools/persian-tools";

export type ElectronicHealthRecordContextProps = {
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
  filters: FormValues;
  setFilters: (filters: FormValues) => void;
  callMutation: () => void;
};

const ElectronicHealthRecordContext = React.createContext<
  ElectronicHealthRecordContextProps | undefined
>(undefined);

const Provider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const today = React.useMemo(() => new Date(), []);
  const [filters, setFilters] = useState<FormValues>({
    nationalNumber: "",
    dateRange: {
      from: today,
      to: today,
    },
    patientType: "2",
  });

  // Data fetching with dynamic filters
  const ehrByNationalNumber_m = useMutation({
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY],
    mutationFn: ehr_by_national_number,
  });

  const { mutate } = ehrByNationalNumber_m;

  const callMutation = React.useCallback(() => {
    mutate({
      params: {
        nationalNumber: digitsFaToEn(filters.nationalNumber || ""),
        fromDate: filters.dateRange?.from
          ? format(filters.dateRange.from, "yyyy/MM/dd")
          : "",
        toDate: filters.dateRange?.to
          ? format(filters.dateRange.to, "yyyy/MM/dd")
          : "",
        patientType: filters.patientType,
      },
    });
  }, [mutate, filters]);

  React.useEffect(() => {
    callMutation();
  }, [callMutation]);

  React.useEffect(() => {
    console.log("ehrByNationalNumber_q.status", ehrByNationalNumber_m.status);
    console.log("ehrByNationalNumber_q.data", ehrByNationalNumber_m.data);
  }, [ehrByNationalNumber_m]);

  return (
    <ElectronicHealthRecordContext.Provider
      value={{ ehrByNationalNumber_m, filters, setFilters, callMutation }}
    >
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
