"use client";

import React from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { format, subYears } from "date-fns-jalali";
import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
  type EHRByNationalNumberApiResponse,
} from "@/data/electronic health record/api/EHR-by-national-number";
import type { ElectronicHealthRecord } from "@/data/electronic health record/type";
import {
  classify,
  isAbnormal,
  jalaliSortKey,
  parseNumeric,
  parseRange,
  type EhrStatus,
  type NormalRange,
} from "./classify";
import { EHR_HISTORY_YEARS, EHR_LAB_TYPE, EHR_REPORT_TYPES } from "./config";

export type LabPoint = {
  service: string;
  value: string;
  range: string;
  date: string;
  sortKey: number;
  numeric: number | null;
  bounds: NormalRange | null;
  status: EhrStatus;
  /** The untouched row, for the detail modal which renders every field. */
  raw: ElectronicHealthRecord;
};

/** One test across every time it was run, oldest first. */
export type LabSeries = {
  service: string;
  latest: LabPoint;
  points: LabPoint[];
  abnormalCount: number;
};

/** A non-numeric result — imaging, pathology, ECG. */
export type ReportItem = {
  service: string;
  result: string;
  date: string;
  sortKey: number;
  raw: ElectronicHealthRecord;
};

/** One result on a timeline date, lab or report. */
export type EhrEventItem = {
  service: string;
  kind: "lab" | "report";
  value: string;
  range: string;
  /** Labs only; reports carry no reference range. */
  status?: EhrStatus;
  raw: ElectronicHealthRecord;
};

export type EhrEvent = {
  date: string;
  sortKey: number;
  count: number;
  items: EhrEventItem[];
};

export type PersonEhr = {
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  /** Abnormal series first. */
  labs: LabSeries[];
  reports: ReportItem[];
  events: EhrEvent[];
  abnormalCount: number;
  normalCount: number;
  /** Results whose reference range could not be read — neither pass nor fail. */
  unknownCount: number;
  /** Lab measurements only — what the band actually lists. */
  labResultCount: number;
  latestLabDate?: string;
  /**
   * Jalali sort key of the exam, for before/after comparisons.
   *
   * Undefined when the step has no exam date. It is deliberately NOT derived
   * from the campaign's `created_at`, which is when the workbook was uploaded
   * — a result landing after the exam but before the upload would otherwise
   * be reported as predating the screening.
   */
  examSortKey?: number;
  /** The window these results were fetched over, so a link out can reuse it. */
  fromDate: string;
  toDate: string;
  hasAny: boolean;
};

const toPoint = (record: ElectronicHealthRecord): LabPoint => {
  const value = record["جواب"] ?? "";
  const range = record["نرمال رنج"] ?? "";
  const date = record["تاريخ"] ?? "";
  return {
    service: record["نام خدمت"] ?? "",
    value,
    range,
    date,
    sortKey: jalaliSortKey(date),
    numeric: parseNumeric(value),
    bounds: parseRange(range),
    status: classify(value, range),
    raw: record,
  };
};

/**
 * Shape the four responses into what the page renders.
 *
 * Unlike the patient-reports page this keeps results whose range will not
 * parse: they surface as `unknown` rather than being filtered away, because a
 * dropped imaging report reads to the user as "this patient had no imaging".
 */
const buildPersonEhr = (
  results: UseQueryResult<EHRByNationalNumberApiResponse, unknown>[],
  range: { fromDate: string; toDate: string; examSortKey?: number }
): PersonEhr => {
  const failed = results.find((r) => r.isError);
  const [labQuery, ...reportQueries] = results;

  const points = (labQuery?.data ?? []).map(toPoint).filter((p) => p.service);

  const byService = new Map<string, LabPoint[]>();
  points.forEach((point) => {
    const bucket = byService.get(point.service);
    if (bucket) bucket.push(point);
    else byService.set(point.service, [point]);
  });

  const labs: LabSeries[] = Array.from(byService.entries())
    .map(([service, bucket]) => {
      const ordered = [...bucket].sort((a, b) => a.sortKey - b.sortKey);
      return {
        service,
        points: ordered,
        latest: ordered[ordered.length - 1],
        abnormalCount: ordered.filter((p) => isAbnormal(p.status)).length,
      };
    })
    // abnormal first — the point of the band is that the admin should not have
    // to read every row to find the problem
    .sort((a, b) => {
      const aBad = isAbnormal(a.latest.status) ? 0 : 1;
      const bBad = isAbnormal(b.latest.status) ? 0 : 1;
      if (aBad !== bBad) return aBad - bBad;
      return a.service.localeCompare(b.service, "fa");
    });

  const reports: ReportItem[] = reportQueries
    .flatMap((query) => query.data ?? [])
    .filter((r) => r["نام خدمت"])
    .map((r) => ({
      service: r["نام خدمت"] ?? "",
      result: r["جواب"] ?? "",
      date: r["تاريخ"] ?? "",
      sortKey: jalaliSortKey(r["تاريخ"]),
      raw: r,
    }))
    .sort((a, b) => b.sortKey - a.sortKey);

  const dates = new Map<string, EhrEvent>();
  const collect = (date: string, sortKey: number, item: EhrEventItem) => {
    if (!date) return;
    const existing = dates.get(date);
    if (existing) {
      existing.count += 1;
      existing.items.push(item);
    } else {
      dates.set(date, { date, sortKey, count: 1, items: [item] });
    }
  };
  points.forEach((p) =>
    collect(p.date, p.sortKey, {
      service: p.service,
      kind: "lab",
      value: p.value,
      range: p.range,
      status: p.status,
      raw: p.raw,
    })
  );
  reports.forEach((r) =>
    collect(r.date, r.sortKey, {
      service: r.service,
      kind: "report",
      value: r.result,
      range: "",
      raw: r.raw,
    })
  );
  const events = Array.from(dates.values()).sort((a, b) => a.sortKey - b.sortKey);

  const abnormalCount = labs.filter((l) => isAbnormal(l.latest.status)).length;
  // Counted explicitly rather than as "everything left over": a result whose
  // range would not parse is `unknown`, and folding it into the normal tally
  // would tell the reader it had been checked and passed.
  const normalCount = labs.filter((l) => l.latest.status === "normal").length;

  return {
    isPending: results.some((r) => r.isPending && r.fetchStatus !== "idle"),
    isError: Boolean(failed),
    errorMessage:
      failed?.error instanceof Error ? failed.error.message : undefined,
    labs,
    reports,
    events,
    abnormalCount,
    normalCount,
    unknownCount: labs.length - abnormalCount - normalCount,
    labResultCount: points.length,
    latestLabDate: labs.length
      ? labs.reduce(
          (latest, series) =>
            series.latest.sortKey > latest.sortKey ? series.latest : latest,
          labs[0].latest
        ).date
      : undefined,
    examSortKey: range.examSortKey,
    fromDate: range.fromDate,
    toDate: range.toDate,
    hasAny: points.length > 0 || reports.length > 0,
  };
};

/** Every electronic result for one person, arranged the way the page reads it. */
export const usePersonEhr = ({
  nationalId,
  campaignDate,
  examDate,
  enabled = true,
}: {
  nationalId: string;
  /**
   * `created_at` of the monitoring campaign, ISO. Used only to anchor how far
   * back to request history — never as the exam date.
   */
  campaignDate: string;
  /**
   * The person's own exam date, Jalali `yyyy/MM/dd`. step_1 records one per
   * person; step_2 has no such column, so it passes nothing and the
   * before/after comparison is withheld rather than guessed.
   */
  examDate?: string;
  enabled?: boolean;
}): PersonEhr => {
  const range = React.useMemo(() => {
    const exam = new Date(campaignDate);
    const anchor = Number.isNaN(exam.getTime()) ? new Date() : exam;
    return {
      fromDate: format(subYears(anchor, EHR_HISTORY_YEARS), "yyyy/MM/dd"),
      toDate: format(new Date(), "yyyy/MM/dd"),
      examSortKey: examDate ? jalaliSortKey(examDate) : undefined,
    };
  }, [campaignDate, examDate]);

  const combine = React.useCallback(
    (results: UseQueryResult<EHRByNationalNumberApiResponse, unknown>[]) =>
      buildPersonEhr(results, range),
    [range]
  );

  return useQueries({
    queries: [EHR_LAB_TYPE, ...EHR_REPORT_TYPES].map((patientType) => ({
      queryKey: [
        EHR_BY_NATIONAL_NUMBER_KEY,
        nationalId,
        patientType,
        range.fromDate,
        range.toDate,
      ],
      queryFn: () =>
        ehr_by_national_number({
          params: {
            nationalNumber: nationalId,
            fromDate: range.fromDate,
            toDate: range.toDate,
            patientType,
          },
        }),
      enabled: enabled && Boolean(nationalId),
      staleTime: 5 * 60 * 1000,
    })),
    combine,
  });
};
