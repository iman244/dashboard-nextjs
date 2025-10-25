"use client";

import React, { useContext, useState } from "react";
import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
  EHRByNationalNumberApiResponse,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { mobile_laboratory_by_national_number, MobileLaboratoryByNationalNumberApiResponse, PDD_MOBILE_LABORATORY_BY_NATIONAL_NUMBER_KEY } from "@/data/electronic health record/api/mobile-laboratory-by-national-number";
import { mobile_xray_by_national_number, MobileXRayByNationalNumberApiResponse, PDD_MOBILE_XRAY_BY_NATIONAL_NUMBER_KEY } from "@/data/electronic health record/api/mobile-xray-by-national-number";
import { mobile_number_by_national_number, MobileNumberByNationalNumberApiResponse, PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY } from "@/data/electronic health record/api/mobile-number-by-national-number";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";

export type PeriodicalReportsFormValues = {
  patientType: string;
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
  filters: PeriodicalReportsFormValues;
  setFilters: (filters: PeriodicalReportsFormValues) => void;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (isDetailModalOpen: boolean) => void;
  selectedRecord: ElectronicHealthRecord | null;
  setSelectedRecord: (selectedRecord: ElectronicHealthRecord | null) => void;
};

const PeriodicalReportsContext = React.createContext<
  PeriodicalReportsContextProps | undefined
>(undefined);

const Provider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [filters, setFilters] = useState<PeriodicalReportsFormValues>({
    patientType: "25",
    dateRange: null,
  });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ElectronicHealthRecord | null>(null);

  // Data fetching with dynamic filters
  const ehrByNationalNumber_m = useMutation({
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY, "periodical"],
    mutationFn: ehr_by_national_number,
    onError: (error) => {
      console.error("Periodical reports error", error);
      toast.error(error.message);
    },
  });

  const mobileLaboratoryByNationalNumber_m = useMutation({
    mutationKey: [PDD_MOBILE_LABORATORY_BY_NATIONAL_NUMBER_KEY, "periodical"],
    mutationFn: mobile_laboratory_by_national_number,
  });

  const mobileXRayByNationalNumber_m = useMutation({
    mutationKey: [PDD_MOBILE_XRAY_BY_NATIONAL_NUMBER_KEY, "periodical"],
    mutationFn: mobile_xray_by_national_number,
  });

  const mobileNumberByNationalNumber_m = useMutation({
    mutationKey: [PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY, "periodical"],
    mutationFn: mobile_number_by_national_number,
    onError: (error) => {
      console.error("error", error);
      toast.error(error.message);
    },
  });

  React.useEffect(() => {
    console.log("selectedRecord", selectedRecord);
    if (selectedRecord) {
      setIsDetailModalOpen(true);
    }
  }, [selectedRecord]);

  return (
    <PeriodicalReportsContext.Provider
      value={{
        ehrByNationalNumber_m,
        mobileLaboratoryByNationalNumber_m,
        mobileXRayByNationalNumber_m,
        mobileNumberByNationalNumber_m,
        filters,
        setFilters,
        isDetailModalOpen,
        setIsDetailModalOpen,
        selectedRecord,
        setSelectedRecord,
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
