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
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import {
  mobile_laboratory_by_national_number,
  MobileLaboratoryByNationalNumberApiResponse,
  PDD_MOBILE_LABORATORY_BY_NATIONAL_NUMBER_KEY,
} from "@/data/electronic health record/api/mobile-laboratory-by-national-number";
import {
  mobile_xray_by_national_number,
  MobileXRayByNationalNumberApiResponse,
  PDD_MOBILE_XRAY_BY_NATIONAL_NUMBER_KEY,
} from "@/data/electronic health record/api/mobile-xray-by-national-number";
import {
  mobile_number_by_national_number,
  MobileNumberByNationalNumberApiResponse,
  PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY,
} from "@/data/electronic health record/api/mobile-number-by-national-number";
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
  // EHRDetailModal needs all three: the lab result PDF, the x-ray PDF, and the
  // patient's mobile number. Same set the electronic-health-record provider
  // hands it.
  mobileLaboratoryByNationalNumber_m: UseMutationResult<
    MobileLaboratoryByNationalNumberApiResponse,
    Error,
    { params: { nationalNumber: string; receptionID: string } }
  >;
  mobileXRayByNationalNumber_m: UseMutationResult<
    MobileXRayByNationalNumberApiResponse,
    Error,
    { params: { nationalNumber: string; receptionID: string } }
  >;
  mobileNumberByNationalNumber_m: UseMutationResult<
    MobileNumberByNationalNumberApiResponse,
    Error,
    { params: { nationalNumber: string } }
  >;
  filters: PatientReportsFormValues;
  setFilters: (filters: PatientReportsFormValues) => void;
  hasData: boolean;
  setHasData: (hasData: boolean) => void;
  selectedRecord: ElectronicHealthRecord | null;
  setSelectedRecord: (record: ElectronicHealthRecord | null) => void;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (isOpen: boolean) => void;
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

  // Detail dialog state
  const [selectedRecord, setSelectedRecord] =
    useState<ElectronicHealthRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  return (
    <PatientReportsContext.Provider
      value={{
        ehrByNationalNumber_m,
        mobileLaboratoryByNationalNumber_m,
        mobileXRayByNationalNumber_m,
        mobileNumberByNationalNumber_m,
        filters,
        setFilters,
        hasData,
        setHasData,
        selectedRecord,
        setSelectedRecord,
        isDetailModalOpen,
        setIsDetailModalOpen,
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
