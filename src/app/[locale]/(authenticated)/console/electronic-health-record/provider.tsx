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
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { mobile_laboratory_by_national_number, MobileLaboratoryByNationalNumberApiResponse, PDD_MOBILE_LABORATORY_BY_NATIONAL_NUMBER_KEY } from "@/data/electronic health record/api/mobile-laboratory-by-national-number";
import { mobile_xray_by_national_number, MobileXRayByNationalNumberApiResponse, PDD_MOBILE_XRAY_BY_NATIONAL_NUMBER_KEY } from "@/data/electronic health record/api/mobile-xray-by-national-number";
import { mobile_number_by_national_number, MobileNumberByNationalNumberApiResponse, PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY } from "@/data/electronic health record/api/mobile-number-by-national-number";
import { toast } from "sonner";

export type ElectronicHealthRecordContextProps = {
  mobileLaboratoryByNationalNumber_m: UseMutationResult<
    MobileLaboratoryByNationalNumberApiResponse,
    Error,
    {
      params: {
        nationalNumber: string;
        receptionID: string;
      };
    }
  >;
  mobileXRayByNationalNumber_m: UseMutationResult<
    MobileXRayByNationalNumberApiResponse,
    Error,
    {
      params: {
        nationalNumber: string;
        receptionID: string;
      };
    }
  >;
  mobileNumberByNationalNumber_m: UseMutationResult<
    MobileNumberByNationalNumberApiResponse,
    Error,
    {
      params: {
        nationalNumber: string;
      };
    }
  >;
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
  // Detail dialog state
  selectedRecord: ElectronicHealthRecord | null;
  setSelectedRecord: (record: ElectronicHealthRecord | null) => void;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (open: boolean) => void;
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
    patientType: "25",
  });

  // Detail dialog state
  const [selectedRecord, setSelectedRecord] = useState<ElectronicHealthRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Data fetching with dynamic filters
  const ehrByNationalNumber_m = useMutation({
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY],
    mutationFn: ehr_by_national_number,
  });

  const mobileLaboratoryByNationalNumber_m = useMutation({
    mutationKey: [PDD_MOBILE_LABORATORY_BY_NATIONAL_NUMBER_KEY],
    mutationFn: mobile_laboratory_by_national_number,
  });

  const mobileXRayByNationalNumber_m = useMutation({
    mutationKey: [PDD_MOBILE_XRAY_BY_NATIONAL_NUMBER_KEY],
    mutationFn: mobile_xray_by_national_number,
  });

  const mobileNumberByNationalNumber_m = useMutation({
    mutationKey: [PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY],
    mutationFn: mobile_number_by_national_number,
    onError: (error) => {
      console.error("error", error);
      toast.error(error.message);
    },
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
  }, [mutate, filters.nationalNumber, filters.dateRange?.from, filters.dateRange?.to, filters.patientType]);

  // Only call mutation when filters change, not on every render
  React.useEffect(() => {
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
  }, [mutate, filters.nationalNumber, filters.dateRange?.from, filters.dateRange?.to, filters.patientType]);

  React.useEffect(() => {
    console.log("ehrByNationalNumber_q.status", ehrByNationalNumber_m.status);
    console.log("ehrByNationalNumber_q.data", ehrByNationalNumber_m.data);
  }, [ehrByNationalNumber_m]);

  const v = React.useMemo(() => ({
    ehrByNationalNumber_m, 
        mobileLaboratoryByNationalNumber_m,
        mobileXRayByNationalNumber_m,
        mobileNumberByNationalNumber_m,
        filters, 
        setFilters, 
        callMutation,
        selectedRecord,
        setSelectedRecord,
        isDetailModalOpen,
        setIsDetailModalOpen
  }),[ehrByNationalNumber_m, mobileLaboratoryByNationalNumber_m, mobileXRayByNationalNumber_m, mobileNumberByNationalNumber_m, filters, setFilters, callMutation, selectedRecord, setSelectedRecord, isDetailModalOpen, setIsDetailModalOpen])

  return (
    <ElectronicHealthRecordContext.Provider
      value={v}
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
