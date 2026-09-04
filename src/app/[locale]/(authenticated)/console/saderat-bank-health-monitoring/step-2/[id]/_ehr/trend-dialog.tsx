"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { cn, localeDigits } from "@/lib/utils";
import { LocaleChartTooltip } from "../_charts/locale-tooltip";
import { STATUS_STYLES, StatusIcon } from "./status-icon";
import type { LabSeries } from "./use-person-ehr";

/**
 * One test over time against its reference range.
 *
 * The bounds are drawn per point with `stepAfter`, not `monotone`: a reference
 * range is a threshold that holds until it is changed, so interpolating it into
 * a curve between two lab visits would invent values it never had.
 */
export const EhrTrendDialog = ({
  series,
  onOpenChange,
}: {
  series: LabSeries | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.Step2Detail"
  );
  const locale = useLocale();
  const isFa = locale === "fa";

  const chartConfig = React.useMemo<ChartConfig>(
    () => ({
      value: { label: t("ehr.chartValue"), color: "var(--chart-1)" },
      min: { label: t("ehr.chartMin"), color: "var(--muted-foreground)" },
      max: { label: t("ehr.chartMax"), color: "var(--muted-foreground)" },
    }),
    [t]
  );

  const data = React.useMemo(
    () =>
      (series?.points ?? [])
        .filter((p) => p.numeric !== null)
        .map((p) => ({
          date: p.date,
          value: p.numeric,
          min: p.bounds?.min ?? null,
          max: p.bounds?.max ?? null,
        })),
    [series]
  );

  return (
    <Dialog open={Boolean(series)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{series?.service}</DialogTitle>
          <DialogDescription>
            {series
              ? t("ehr.measurementCount", {
                  count: localeDigits(series.points.length, locale),
                })
              : ""}
          </DialogDescription>
        </DialogHeader>

        {series && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusIcon status={series.latest.status} />
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  STATUS_STYLES[series.latest.status].text
                )}
              >
                {localeDigits(series.latest.value, locale)}
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                {series.latest.range
                  ? `${t("ehr.rangeLabel")} ${localeDigits(series.latest.range, locale)}`
                  : t("ehr.noRange")}
              </span>
              <span className="ms-auto text-sm text-muted-foreground tabular-nums">
                {localeDigits(series.latest.date, locale)}
              </span>
            </div>

            {data.length > 1 ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ComposedChart data={data} margin={{ left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    fontSize={12}
                    tickMargin={8}
                    tickFormatter={(v) => (isFa ? digitsEnToFa(String(v)) : String(v))}
                  />
                  <YAxis
                    fontSize={12}
                    width={48}
                    tickFormatter={(v) =>
                      isFa ? digitsEnToFa(String(v ?? "")) : String(v ?? "")
                    }
                  />
                  <ChartTooltip content={<LocaleChartTooltip />} />
                  <Line
                    type="stepAfter"
                    dataKey="min"
                    stroke="var(--color-min)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="stepAfter"
                    dataKey="max"
                    stroke="var(--color-max)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-value)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("ehr.notEnoughPoints")}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
