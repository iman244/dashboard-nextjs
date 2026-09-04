"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck, CircleDashed } from "lucide-react";
import { cn, localeDigits } from "@/lib/utils";
import { buildFollowUp, parseRequestedTests } from "./follow-up";
import type { PersonEhr } from "./use-person-ehr";

/**
 * `آزمایشات تکمیلی مورد نیاز` turned from a sentence into a status list.
 *
 * This is the one excel field that describes the future rather than the exam
 * moment, which is what lets the electronic record's timestamps answer it: the
 * excel says what was ordered, the EHR says what came back afterwards.
 */
export const FollowUpCheck = ({
  requestedRaw,
  ehr,
}: {
  requestedRaw: unknown;
  ehr: PersonEhr;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.Step2Detail"
  );
  const locale = useLocale();

  const items = React.useMemo(() => {
    const requested = parseRequestedTests(requestedRaw);
    if (requested.length === 0) return [];
    return buildFollowUp(requested, ehr);
  }, [requestedRaw, ehr]);

  if (items.length === 0 || ehr.isPending || ehr.isError) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="mt-2 space-y-2 rounded-md border-s-2 border-primary/40 bg-muted/40 py-2 pe-2 ps-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.7rem] font-medium text-muted-foreground">
          {t("ehr.followUpLabel")}
        </span>
        <span className="text-[0.7rem] text-muted-foreground tabular-nums">
          {t("ehr.followUpProgress", {
            done: localeDigits(doneCount, locale),
            total: localeDigits(items.length, locale),
          })}
        </span>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-xs">
            {item.done ? (
              <CircleCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <CircleDashed
                aria-hidden="true"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
              />
            )}
            <span className="min-w-0 flex-1 break-words">{item.label}</span>
            <span
              className={cn(
                "shrink-0 tabular-nums",
                item.done ? "text-muted-foreground" : "text-destructive"
              )}
            >
              {item.done
                ? item.date
                  ? localeDigits(item.date, locale)
                  : t("ehr.followUpDone")
                : t("ehr.followUpPending")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
