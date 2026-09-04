"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { localeDigits } from "@/lib/utils";
import { EVIDENCE_LINKS } from "./config";
import type { PersonEhr } from "./use-person-ehr";

/**
 * Every imaging, pathology and paraclinical report that is not already shown
 * beside an excel field.
 *
 * A report is only displayed inline when its excel counterpart has a value, so
 * matching a link is not enough to consider it shown — this person may have an
 * ECG on file while their `تفسير الكتروكارديوگرام` cell is blank. `shownFields`
 * carries the fields actually rendered, and anything else lands here.
 *
 * Without this the page would swallow those reports outright: the same failure
 * mode as patient-reports dropping every result with no numeric range, where
 * the reader concludes "this patient had no imaging" from what is really a
 * gap in the join.
 */
export const EhrOtherReports = ({
  ehr,
  shownFields,
}: {
  ehr: PersonEhr;
  shownFields: ReadonlySet<string>;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.Step2Detail"
  );
  const locale = useLocale();

  const unmatched = React.useMemo(
    () =>
      ehr.reports.filter(
        (report) =>
          !EVIDENCE_LINKS.some(
            (link) => link.match.test(report.service) && shownFields.has(link.field)
          )
      ),
    [ehr.reports, shownFields]
  );

  if (ehr.isPending || unmatched.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("ehr.otherReports")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {unmatched.map((report, i) => (
          <div
            key={`${report.service}-${report.date}-${i}`}
            className="space-y-0.5 border-b pb-2 last:border-b-0 last:pb-0"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 text-sm font-medium break-words">
                {report.service}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {localeDigits(report.date, locale)}
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
