"use client";

import React from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
  EHRByNationalNumberApiResponse,
} from "@/data/electronic health record/api/EHR-by-national-number";
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
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { usePatientSession } from "../../provider";
import {
  defaultDateRange,
  PATIENT_DEFAULT_PATIENT_TYPE,
  toJalali,
} from "../../_data/ehr-params";

export type PatientRecordsFilters = {
  dateRange: { from?: Date; to?: Date } | null;
  patientType: string;
};

export type PatientRecordsContextType = {
  nationalId: string | null;
  filters: PatientRecordsFilters;
  setFilters: (filters: PatientRecordsFilters) => void;
  resetFilters: () => void;
  loadRecords: () => void;
  records_m: UseMutationResult<
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
    { params: { nationalNumber: string; receptionID: string } }
  >;
  mobileXRayByNationalNumber_m: UseMutationResult<
    MobileXRayByNationalNumberApiResponse,
    Error,
    { params: { nationalNumber: string; receptionID: string } }
  >;
  selectedRecord: ElectronicHealthRecord | null;
  isDetailModalOpen: boolean;
  openDetail: (record: ElectronicHealthRecord) => void;
  closeDetail: () => void;
};

const PatientRecordsContext = React.createContext<
  PatientRecordsContextType | undefined
>(undefined);

const buildDefaultFilters = (): PatientRecordsFilters => ({
  dateRange: defaultDateRange(),
  patientType: PATIENT_DEFAULT_PATIENT_TYPE,
});

const Provider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { nationalId } = usePatientSession();
  const [filters, setFilters] =
    React.useState<PatientRecordsFilters>(buildDefaultFilters);
  const [selectedRecord, setSelectedRecord] =
    React.useState<ElectronicHealthRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  const records_m = useMutation({
    mutationKey: [EHR_BY_NATIONAL_NUMBER_KEY, "patient", nationalId],
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

  const { mutate } = records_m;

  /**
   * The single place the records call is made. The console page has this same
   * body twice — once in an effect and once in its refresh handler — which is
   * exactly how the two drift apart.
   *
   * The national id comes from the session, never from `filters`, so there is
   * no state anywhere that could point this at another patient.
   */
  const loadRecords = React.useCallback(() => {
    if (!nationalId) return;
    mutate({
      params: {
        nationalNumber: digitsFaToEn(nationalId),
        fromDate: filters.dateRange?.from
          ? toJalali(filters.dateRange.from)
          : "",
        toDate: filters.dateRange?.to ? toJalali(filters.dateRange.to) : "",
        patientType: filters.patientType,
      },
    });
  }, [mutate, nationalId, filters]);

  React.useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const resetFilters = React.useCallback(() => {
    setFilters(buildDefaultFilters());
  }, []);

  const openDetail = React.useCallback((record: ElectronicHealthRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  }, []);

  const closeDetail = React.useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedRecord(null);
  }, []);

  const value = React.useMemo(
    () => ({
      nationalId,
      filters,
      setFilters,
      resetFilters,
      loadRecords,
      records_m,
      mobileLaboratoryByNationalNumber_m,
      mobileXRayByNationalNumber_m,
      selectedRecord,
      isDetailModalOpen,
      openDetail,
      closeDetail,
    }),
    [
      nationalId,
      filters,
      resetFilters,
      loadRecords,
      records_m,
      mobileLaboratoryByNationalNumber_m,
      mobileXRayByNationalNumber_m,
      selectedRecord,
      isDetailModalOpen,
      openDetail,
      closeDetail,
    ]
  );

  return (
    <PatientRecordsContext.Provider value={value}>
      {children}
    </PatientRecordsContext.Provider>
  );
};

export default Provider;

export const usePatientRecords = () => {
  const context = React.useContext(PatientRecordsContext);
  if (!context) {
    throw new Error("usePatientRecords must be used within its Provider");
  }
  return context;
};
