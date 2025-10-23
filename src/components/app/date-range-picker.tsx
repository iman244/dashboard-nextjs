"use client";

import React from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { formatDate } from "@/app/[locale]/(authenticated)/console/electronic-health-record/_utils/format-date";
import { format, startOfMonth, startOfYear, subMonths, endOfMonth } from "date-fns-jalali";

interface DateRangePickerProps {
  value?: { from?: Date; to?: Date } | null;
  onChange: (range: { from?: Date; to?: Date } | null) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "انتخاب بازه تاریخ",
  className,
}: DateRangePickerProps) {
  const locale = useLocale();

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
        label: `از ابتدای سال ${digitsEnToFa(format(previousJalaliYear, "yyyy"))}`,
        range: { from: startOfPreviousJalaliYear, to: now }
      },
      {
        label: `از ابتدای امسال`,
        range: { from: startOfCurrentJalaliYear, to: now }
      },
      {
        label: `از ابتدای ${digitsEnToFa(format(previousMonth, "MMMM"))}`,
        range: { from: startOfPreviousMonth, to: now }
      },
      {
        label: `از ابتدای ${digitsEnToFa(format(now, "MMMM"))}`,
        range: { from: startOfCurrentMonth, to: now }
      },

    ];
  }, [])

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
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  <span>
                    {digitsEnToFa(formatDate(value.from, locale))}
                  </span>
                  {" - "}
                  <span dir="rtl">
                    {digitsEnToFa(formatDate(value.to, locale))}
                  </span>
                </>
              ) : (
                <span>
                  {digitsEnToFa(formatDate(value.from, locale))}
                </span>
              )
            ) : (
              <span>{digitsEnToFa(placeholder)}</span>
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
            className="text-xs justify-start text-right"
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
