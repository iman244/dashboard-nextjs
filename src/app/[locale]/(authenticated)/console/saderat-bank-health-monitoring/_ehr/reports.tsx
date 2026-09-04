"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { localeDigits } from "@/lib/utils";
import type { PersonEhr } from "./use-person-ehr";

/**
 * Imaging, pathology and paraclinical reports, newest first.
 *
 * Listed on their own rather than beside the step_2 field each one evidences,
 * because nothing in either type says which field that is — see the note in
 * config.ts. Every report is shown; none is filtered on a guess.
 *
 * The only claim made about a report is when it arrived relative to the
 * screening, which is arithmetic on `تاريخ` and the campaign's `created_at`.
 */
export const EhrReports = ({ ehr }: { ehr: PersonEhr }) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.Ehr"
  );
  const locale = useLocale();

  if (ehr.isPending || ehr.reports.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("reportsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ehr.reports.map((report, i) => (
          <div
            key={`${report.service}-${report.date}-${i}`}
            className="space-y-1 border-b pb-3 last:border-b-0 last:pb-0"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 text-sm font-medium break-words">
                {report.service}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {report.sortKey > ehr.examSortKey && (
                  <Badge variant="secondary">{t("afterScreening")}</Badge>
                )}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {localeDigits(report.date, locale)}
                </span>
              </span>
            </div>
            {report.result && (
              <p className="text-sm text-muted-foreground break-words">
                {localeDigits(report.result, locale)}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
