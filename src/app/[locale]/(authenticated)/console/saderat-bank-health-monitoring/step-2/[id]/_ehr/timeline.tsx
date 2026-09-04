"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns-jalali";
import { cn, localeDigits } from "@/lib/utils";
import { jalaliTimestamp } from "./classify";
import type { PersonEhr } from "./use-person-ehr";

type Marker = { key: string; label: string; offset: number; count: number };

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
    "/console/saderat-bank-health-monitoring.Step2Detail"
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
    }));

    return {
      markers,
      examOffset: at(examTime),
      examLabel: format(exam, "yyyy/MM/dd"),
      startLabel: points[0].date,
      endLabel: points[points.length - 1].date,
    };
  }, [ehr.events, campaignDate]);

  if (!model) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground tabular-nums">
        <span>{localeDigits(model.startLabel, locale)}</span>
        <span>{localeDigits(model.endLabel, locale)}</span>
      </div>

      <div className="relative h-10">
        <div className="absolute inset-x-0 top-4 h-px bg-border" />

        {model.markers.map((marker) => (
          <span
            key={marker.key}
            title={`${localeDigits(marker.label, locale)} · ${t("ehr.resultCount", {
              count: localeDigits(marker.count, locale),
            })}`}
            style={{ insetInlineStart: `${marker.offset}%` }}
            className={cn(
              "absolute top-4 -translate-y-1/2 rounded-full bg-primary",
              marker.count > 1 ? "h-2.5 w-2.5" : "h-2 w-2"
            )}
          />
        ))}

        <span
          style={{ insetInlineStart: `${model.examOffset}%` }}
          className="absolute top-1 h-6 w-0.5 bg-destructive"
        />
        <span
          style={{ insetInlineStart: `${model.examOffset}%` }}
          className="absolute top-8 -translate-x-1/2 whitespace-nowrap text-[0.7rem] font-medium text-destructive rtl:translate-x-1/2"
        >
          {t("ehr.examMarker")}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("ehr.timelineHint", {
          date: localeDigits(model.examLabel, locale),
        })}
      </p>
    </div>
  );
};
