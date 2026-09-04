"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns-jalali";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, localeDigits } from "@/lib/utils";
import { StatusIcon } from "./status-icon";
import { jalaliTimestamp } from "./classify";
import type { EhrEvent, PersonEhr } from "./use-person-ehr";

type Marker = {
  key: string;
  label: string;
  offset: number;
  count: number;
  items: EhrEvent["items"];
};

/**
 * Every electronic result on one axis, with the screening marked.
 *
 * Positioned with `inset-inline-start`, so time runs right-to-left in Persian
 * and left-to-right in English without a second code path — oldest always sits
 * at the reading-start edge.
 */
export const EhrTimeline = ({
  ehr,
  campaignDate,
}: {
  ehr: PersonEhr;
  campaignDate: string;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.Ehr"
  );
  const locale = useLocale();

  const model = React.useMemo(() => {
    const exam = new Date(campaignDate);
    const examTime = Number.isNaN(exam.getTime()) ? null : exam.getTime();

    const points = ehr.events
      .map((e) => ({ ...e, time: jalaliTimestamp(e.date) }))
      .filter((e): e is typeof e & { time: number } => e.time !== null);

    if (points.length === 0 || examTime === null) return null;

    const times = [...points.map((p) => p.time), examTime];
    const min = Math.min(...times);
    const max = Math.max(...times);
    const span = max - min;
    const at = (time: number) => (span === 0 ? 50 : ((time - min) / span) * 100);

    const markers: Marker[] = points.map((p) => ({
      key: p.date,
      label: p.date,
      offset: at(p.time),
      count: p.count,
      items: p.items,
    }));

    return {
      markers,
      examOffset: at(examTime),
      examLabel: format(exam, "yyyy/MM/dd"),
      startLabel: points[0].date,
      endLabel: points[points.length - 1].date,
    };
  }, [ehr.events, campaignDate]);

  if (ehr.isPending) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (ehr.isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>{ehr.errorMessage || t("loadError")}</span>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Inbox aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>{t("noRecords")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground tabular-nums">
        <span>{localeDigits(model.startLabel, locale)}</span>
        <span>{localeDigits(model.endLabel, locale)}</span>
      </div>

      <div className="relative h-10">
        <div className="absolute inset-x-0 top-4 h-px bg-border" />

        {model.markers.map((marker) => (
          <Tooltip key={marker.key}>
            <TooltipTrigger
              type="button"
              aria-label={`${localeDigits(marker.label, locale)} · ${t(
                "resultCount",
                { count: localeDigits(marker.count, locale) }
              )}`}
              style={{ insetInlineStart: `${marker.offset}%` }}
              className={cn(
                "absolute top-4 -translate-y-1/2 rounded-full bg-primary",
                "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
                "hover:ring-primary/30 hover:ring-4",
                marker.count > 1 ? "h-2.5 w-2.5" : "h-2 w-2"
              )}
            />
            <TooltipContent className="max-w-xs">
              <p className="font-medium tabular-nums">
                {localeDigits(marker.label, locale)}
                {" · "}
                {t("resultCount", {
                  count: localeDigits(marker.count, locale),
                })}
              </p>
              <ul className="mt-1 space-y-0.5">
                {marker.items.slice(0, 8).map((item, i) => (
                  <li
                    key={`${item.service}-${i}`}
                    className="flex items-baseline gap-1.5"
                  >
                    {item.status && <StatusIcon status={item.status} />}
                    <span className="min-w-0 break-words">{item.service}</span>
                    {item.value && (
                      <span className="tabular-nums opacity-80">
                        {localeDigits(item.value, locale)}
                      </span>
                    )}
                  </li>
                ))}
                {marker.items.length > 8 && (
                  <li className="opacity-80">
                    {t("andMore", {
                      count: localeDigits(marker.items.length - 8, locale),
                    })}
                  </li>
                )}
              </ul>
            </TooltipContent>
          </Tooltip>
        ))}

        <span
          style={{ insetInlineStart: `${model.examOffset}%` }}
          className="absolute top-1 h-6 w-0.5 bg-destructive"
        />
        <span
          style={{ insetInlineStart: `${model.examOffset}%` }}
          className="absolute top-8 -translate-x-1/2 whitespace-nowrap text-[0.7rem] font-medium text-destructive rtl:translate-x-1/2"
        >
          {t("examMarker")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
          {t("legendResult")}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-0.5 bg-destructive" />
          {t("legendExam", { date: localeDigits(model.examLabel, locale) })}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("timelineHint")}
      </p>
    </div>
  );
};
