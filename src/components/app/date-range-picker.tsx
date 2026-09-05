"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useLocaleDigits } from "@/lib/use-locale-digits";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { formatDate } from "@/lib/utils";
import { format, startOfMonth, startOfYear, subMonths } from "date-fns-jalali";

interface DateRangePickerProps {
  value?: { from?: Date; to?: Date } | null;
  onChange: (range: { from?: Date; to?: Date } | null) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder,
  className,
}: DateRangePickerProps) {
  const locale = useLocale();
  const fmt = useLocaleDigits();
  const t = useTranslations("common.DateRangePicker");

  const getUtilityButtons = React.useCallback(() => {
    const now = new Date();
    
    // Start of current Jalali year
    const startOfCurrentJalaliYear = startOfYear(now);

    // Start of current month
    const startOfCurrentMonth = startOfMonth(now);

    // Start of previous month
    const previousMonth = subMonths(now, 1);
    const startOfPreviousMonth = startOfMonth(previousMonth);
    
    // Start of previous Jalali year
    const previousJalaliYear = subMonths(now, 12);
    const startOfPreviousJalaliYear = startOfYear(previousJalaliYear);

    return [
      {
        // The months and years stay Jalali in both locales: the calendar this
        // control opens is Jalali, so a Gregorian label would name a different
        // range than the one it selects.
        label: t("sinceYear", { year: fmt(format(previousJalaliYear, "yyyy")) }),
        range: { from: startOfPreviousJalaliYear, to: now }
      },
      {
        label: t("sinceThisYear"),
        range: { from: startOfCurrentJalaliYear, to: now }
      },
      {
        label: t("sinceMonth", { month: fmt(format(previousMonth, "MMMM")) }),
        range: { from: startOfPreviousMonth, to: now }
      },
      {
        label: t("sinceMonth", { month: fmt(format(now, "MMMM")) }),
        range: { from: startOfCurrentMonth, to: now }
      },

    ];
    // `fmt` and `t` are both locale-bound; an empty dep list froze these labels
    // at whatever locale rendered first.
  }, [fmt, t])

  const utilityButtons = getUtilityButtons();

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="me-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  <span>
                    {fmt(formatDate(value.from, locale))}
                  </span>
                  {" - "}
                  <span>
                    {fmt(formatDate(value.to, locale))}
                  </span>
                </>
              ) : (
                <span>
                  {fmt(formatDate(value.from, locale))}
                </span>
              )
            ) : (
              <span>{placeholder ?? t("placeholder")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={{
              from: value?.from,
              to: value?.to,
            }}
            onSelect={(range) => onChange(range || null)}
            className="rounded-lg border shadow-sm"
          />
        </PopoverContent>
      </Popover>
      
      <div className="flex flex-wrap gap-2">
        {utilityButtons.map((button, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="text-xs justify-start text-start"
            onClick={() => onChange(button.range)}
            type="button"
          >
            {button.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
