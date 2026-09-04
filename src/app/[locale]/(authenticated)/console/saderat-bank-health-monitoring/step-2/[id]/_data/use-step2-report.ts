import React from "react";
import type { SBHM_Step2Record } from "@/data/saderat-bank-health-monitoring/types";
import { STEP2_CHART_FIELDS } from "../_charts/config";

export type DistributionDatum = { name: string; value: number };

/** Counts per distinct value of one field. One pass, empties skipped. */
const countValues = (
  records: SBHM_Step2Record[],
  field: keyof SBHM_Step2Record
): DistributionDatum[] => {
  const counts = new Map<string, number>();
  for (const record of records) {
    const value = record[field];
    if (value === null || value === undefined || value === "") continue;
    const key = String(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export type Step2Report = {
  totalRecords: number;
  /** Keyed by field. Only fields that a configured chart renders. */
  distributions: Partial<Record<keyof SBHM_Step2Record, DistributionDatum[]>>;
};

/**
 * Derives the report from the configured charts, so computed and rendered can
 * never drift apart. The step-1 page computed 66 distributions to render 21;
 * here the set is STEP2_CHART_FIELDS by construction.
 */
export const useStep2Report = (
  records: SBHM_Step2Record[] | undefined
): Step2Report | null =>
  React.useMemo(() => {
    if (!records || records.length === 0) return null;

    const distributions: Step2Report["distributions"] = {};
    for (const field of STEP2_CHART_FIELDS) {
      distributions[field] = countValues(records, field);
    }

    return { totalRecords: records.length, distributions };
  }, [records]);
