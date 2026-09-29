"use client";

import React from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { format } from "date-fns-jalali";
import { PatientType, PATIENT_TYPE_ORDER } from "@/components/app/patient-type-selector";
import {
  EHR_BY_NATIONAL_NUMBER_KEY,
  ehr_by_national_number,
  type EHRByNationalNumberApiResponse,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { buildPersonEhr, type PersonEhr } from "../../saderat-bank-health-monitoring/_ehr/use-person-ehr";

export type PatientEhrTab = { type: PatientType; ehr: PersonEhr };
export type PatientEhrFailure = { type: PatientType; retry: () => void; isFetching: boolean };

/**
 * Every EHR record type for one patient, loaded together; tabs only for types
 * with rows to show.
 *
 * `settled` stays false until every type has answered, so the caller can show
 * one placeholder instead of tabs popping in one by one. A disabled hook is
 * settled at once and returns nothing, or it would show that placeholder
 * forever.
 *
 * A type whose request failed is listed in `failed` and never in `tabs`, even
 * when the cache still holds rows from an earlier success of the same request:
 * the section shows that type's error with a retry, not rows it could not
 * refresh beside an error about them. `isFetching` stays true for the
 * duration of a retry — React Query keeps `isError` true while a failed query
 * refetches, so the caller needs its own signal to show that the retry is in
 * flight rather than leaving the button looking inert.
 *
 * Keys match `useEHRByNationalNumberApi` for the same (id, type, from, to),
 * so the two share cache entries.
 */
export const usePatientEhrTabs = ({
  nationalId,
  range,
  enabled,
}: {
  nationalId: string;
  range: { from: Date; to: Date };
  enabled: boolean;
}): { settled: boolean; tabs: PatientEhrTab[]; failed: PatientEhrFailure[] } => {
  const fromDate = format(range.from, "yyyy/MM/dd");
  const toDate = format(range.to, "yyyy/MM/dd");
  const active = enabled && Boolean(nationalId);

  // Shaped in `combine` rather than a memo over the results: `useQueries`
  // returns a new array every render, so such a memo would never hit. A stable
  // `combine` is re-run only when a query's result actually changes, so the
  // returned object is safe to key effects on.
  const combine = React.useCallback(
    (results: UseQueryResult<EHRByNationalNumberApiResponse, unknown>[]) => {
      if (!active) return { settled: true, tabs: [], failed: [] };
      const settled = results.every((r) => !r.isPending);
      const tabs = PATIENT_TYPE_ORDER.flatMap((type, i): PatientEhrTab[] => {
        const r = results[i];
        if (r.isError || !r.data?.length) return [];
        const ehr =
          type === PatientType.LAB
            ? buildPersonEhr({ lab: r, reports: [] })
            : buildPersonEhr({ reports: [r] });
        // `buildPersonEhr` drops rows without a service name, so rows in the
        // response do not guarantee anything to show.
        return ehr.hasAny ? [{ type, ehr }] : [];
      });
      const failed = PATIENT_TYPE_ORDER.flatMap((type, i): PatientEhrFailure[] => {
        const r = results[i];
        return r.isError ? [{ type, retry: () => void r.refetch(), isFetching: r.isFetching }] : [];
      });
      return { settled, tabs, failed };
    },
    [active]
  );

  return useQueries({
    queries: PATIENT_TYPE_ORDER.map((patientType) => ({
      queryKey: [EHR_BY_NATIONAL_NUMBER_KEY, nationalId, patientType, fromDate, toDate],
      queryFn: () =>
        ehr_by_national_number({
          params: { nationalNumber: nationalId, fromDate, toDate, patientType },
        }),
      enabled: active,
      staleTime: 5 * 60 * 1000,
      meta: { silentNetworkError: true },
    })),
    combine,
  });
};
