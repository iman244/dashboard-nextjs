"use client";

import React from "react";
import type { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { EHRDetailModal } from "@/data/electronic health record/components/EHRDetailModal";
import { useMobileLaboratoryByNationalNumberApi } from "@/data/electronic health record/api/mobile-laboratory-by-national-number";
import { useMobileNumberByNationalNumberApi } from "@/data/electronic health record/api/mobile-number-by-national-number";
import { useMobileXRayByNationalNumberApi } from "@/data/electronic health record/api/mobile-xray-by-national-number";

/**
 * The electronic-health-record page's detail modal, reusable from the step
 * pages.
 *
 * It needs three mobile mutations alongside the record, which is the reason
 * this exists as a hook rather than a plain component: both step pages would
 * otherwise repeat that wiring, and step-1 already had a copy of it.
 *
 * Returns the element to render and the opener to hand to any row.
 */
export const useRecordDetail = () => {
  const [record, setRecord] = React.useState<ElectronicHealthRecord | null>(
    null
  );

  const mobileLaboratoryByNationalNumber_m =
    useMobileLaboratoryByNationalNumberApi();
  const mobileXRayByNationalNumber_m = useMobileXRayByNationalNumberApi();
  const mobileNumberByNationalNumber_m = useMobileNumberByNationalNumberApi();

  const close = React.useCallback(() => setRecord(null), []);

  const modal = (
    <EHRDetailModal
      record={record}
      isOpen={Boolean(record)}
      onClose={close}
      actions={{
        mobileLaboratoryByNationalNumber_m,
        mobileXRayByNationalNumber_m,
        mobileNumberByNationalNumber_m,
      }}
    />
  );

  return { open: setRecord, modal };
};
