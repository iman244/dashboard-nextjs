"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { localeDigits } from "@/lib/utils";
import type { SBHM_Step2Record } from "@/data/saderat-bank-health-monitoring/types";
import { EVIDENCE_LINKS } from "./config";
import type { PersonEhr } from "./use-person-ehr";

/**
 * The electronic report behind one excel verdict, rendered inside the same
 * card as the verdict itself.
 *
 * The excel says a physician concluded something; this says what they were
 * looking at. Keeping them adjacent is the point — on separate cards the
 * reader has to hold one in memory to read the other.
 *
 * Renders nothing when no service matches, so an unmatched pattern in
 * EVIDENCE_LINKS costs a missing panel rather than a wrong one.
 */
export const FieldEvidence = ({
  field,
  ehr,
}: {
  field: keyof SBHM_Step2Record;
  ehr: PersonEhr;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.Step2Detail"
  );
  const locale = useLocale();

  const matches = React.useMemo(() => {
    const link = EVIDENCE_LINKS.find((l) => l.field === field);
    if (!link) return [];
    return ehr.reports.filter((r) => link.match.test(r.service));
  }, [field, ehr.reports]);

  if (matches.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5 rounded-md border-s-2 border-primary/40 bg-muted/40 py-2 pe-2 ps-3">
      <span className="text-[0.7rem] font-medium text-muted-foreground">
        {t("ehr.evidenceLabel")}
      </span>
      {matches.map((report, i) => (
        <div key={`${report.service}-${report.date}-${i}`} className="space-y-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium break-words min-w-0">
              {report.service}
            </span>
            <span className="shrink-0 text-[0.7rem] text-muted-foreground tabular-nums">
              {localeDigits(report.date, locale)}
            </span>
          </div>
          {report.result && (
            <p className="text-xs text-muted-foreground break-words">
              {localeDigits(report.result, locale)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};
