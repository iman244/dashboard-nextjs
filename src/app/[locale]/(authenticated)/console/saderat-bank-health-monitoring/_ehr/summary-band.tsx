"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ExternalLink, Inbox } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PatientType } from "@/components/app/patient-type-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, localeDigits } from "@/lib/utils";
import { isAbnormal } from "./classify";
import { STATUS_STYLES, StatusIcon } from "./status-icon";
import type { LabSeries, PersonEhr } from "./use-person-ehr";

const PREVIEW_COUNT = 8;

const LabChip = ({
  series,
  onSelect,
  locale,
  rangeLabel,
}: {
  series: LabSeries;
  onSelect: (series: LabSeries) => void;
  locale: string;
  rangeLabel: string;
}) => {
  const { latest } = series;
  const styles = STATUS_STYLES[latest.status];
  return (
    <button
      type="button"
      onClick={() => onSelect(series)}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border p-3 text-start transition-colors",
        "hover:bg-accent focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
        styles.border
      )}
    >
      <span className="line-clamp-1 text-xs text-muted-foreground" title={series.service}>
        {series.service}
      </span>
      <span className="flex items-center gap-1.5">
        <StatusIcon status={latest.status} />
        <span className={cn("text-lg font-semibold tabular-nums", styles.text)}>
          {localeDigits(latest.value, locale)}
        </span>
      </span>
      {latest.range && (
        <span className="text-[0.7rem] text-muted-foreground tabular-nums">
          {rangeLabel} {localeDigits(latest.range, locale)}
        </span>
      )}
    </button>
  );
};

/**
 * The page's lead: what is out of range, before any of the excel detail.
 *
 * step_2 records verdicts and carries no numbers at all, so this band is the
 * only place the reader can see the values a verdict was based on.
 */
export const EhrSummaryBand = ({
  ehr,
  nationalId,
  onSelectSeries,
}: {
  ehr: PersonEhr;
  nationalId: string;
  onSelectSeries: (series: LabSeries) => void;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.Ehr"
  );
  const locale = useLocale();
  const [expanded, setExpanded] = React.useState(false);

  const visible = expanded ? ehr.labs : ehr.labs.slice(0, PREVIEW_COUNT);
  const hidden = ehr.labs.length - visible.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{t("title")}</CardTitle>
          {!ehr.isPending && ehr.labs.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("resultCount", {
                count: localeDigits(ehr.labResultCount, locale),
              })}
              {ehr.latestLabDate
                ? ` · ${t("latest", {
                    date: localeDigits(ehr.latestLabDate, locale),
                  })}`
                : ""}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {!ehr.isPending && ehr.labs.length > 0 && (
          <p aria-live="polite" className="text-sm">
            <span
              className={cn(
                "font-semibold tabular-nums",
                ehr.abnormalCount > 0 ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {t("abnormalCount", {
                count: localeDigits(ehr.abnormalCount, locale),
              })}
            </span>
            <span className="text-muted-foreground">
              {" · "}
              {t("normalCount", {
                count: localeDigits(ehr.normalCount, locale),
              })}
              {ehr.unknownCount > 0 &&
                ` · ${t("unknownCount", {
                  count: localeDigits(ehr.unknownCount, locale),
                })}`}
            </span>
          </p>
          )}
          <Button asChild variant="outline" size="sm">
            <Link
              href={{
                pathname: "/console/patient-reports",
                query: {
                  nationalNumber: nationalId,
                  fromDate: ehr.fromDate,
                  toDate: ehr.toDate,
                  patientType: PatientType.LAB,
                },
              }}
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              {t("openPatientReport")}
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {ehr.isPending && (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[5.25rem]" />
            ))}
          </div>
        )}

        {/* The translated sentence leads and the transport's own message follows
            as detail — `ehr.errorMessage` is an axios string like "Network
            Error", which tells a Persian-reading admin nothing actionable. */}
        {!ehr.isPending && ehr.isError && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0">
              {t("loadError")}
              {ehr.errorMessage && (
                <span className="block text-xs opacity-70">
                  {ehr.errorMessage}
                </span>
              )}
            </span>
          </div>
        )}

        {!ehr.isPending && !ehr.isError && ehr.labs.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Inbox aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span>
              {ehr.reports.length > 0
                ? t("noLabsButReports", {
                    count: localeDigits(ehr.reports.length, locale),
                  })
                : t("noLabs")}
            </span>
          </div>
        )}

        {!ehr.isPending && ehr.labs.length > 0 && (
          <div className="space-y-3">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {visible.map((series) => (
                <LabChip
                  key={series.service}
                  series={series}
                  onSelect={onSelectSeries}
                  locale={locale}
                  rangeLabel={t("rangeLabel")}
                />
              ))}
            </div>
            {(hidden > 0 || expanded) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded
                  ? t("showLess")
                  : t("showAll", { count: localeDigits(hidden, locale) })}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/** Whether any lab is worth the reader's attention, for callers that gate UI. */
export const hasAbnormal = (ehr: PersonEhr) =>
  ehr.labs.some((l) => isAbnormal(l.latest.status));
