"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CalendarIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePeriodicalReports } from "../provider";
import { Calendar } from "@/components/ui/calendar";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { formatDate } from "../../electronic-health-record/_utils/format-date";
import { format, newDate } from "date-fns-jalali";

// Form schema using Zod
const formSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

export type PeriodicalReportsFormValues = z.infer<typeof formSchema>;

/**
 * Periodical Reports Date Range Form Component
 * Provides date range selection for periodical reports
 */
export const PeriodicalReportsForm = (props: {
  initialValues: { fromDate?: string; toDate?: string };
  compact?: boolean;
}) => {
  console.log({props})
  const t = useTranslations("PeriodicalReports");
  const { setFilters, ehrByNationalNumber_m } = usePeriodicalReports();
  const locale = useLocale();

  const form = useForm<PeriodicalReportsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateRange: props.initialValues?.fromDate && props.initialValues?.toDate
        ? {
            from: (() => {
              const [year, month, day] = props.initialValues.fromDate!.split('/').map(Number);
              return newDate(year, month - 1, day);
            })(),
            to: (() => {
              const [year, month, day] = props.initialValues.toDate!.split('/').map(Number);
              return newDate(year, month - 1, day);
            })(),
          }
        : undefined,
    },
  });


  const { mutate } = ehrByNationalNumber_m;

  const onSubmit = React.useCallback(
    (data: PeriodicalReportsFormValues) => {
      setFilters(data);
      mutate({
        params: {
          nationalNumber: "",
          fromDate: data.dateRange?.from
            ? format(data.dateRange.from, "yyyy/MM/dd")
            : "",
          toDate: data.dateRange?.to
            ? format(data.dateRange.to, "yyyy/MM/dd")
            : "",
          patientType: "2",
        },
      });
    },
    [setFilters, mutate]
  );

  if (props.compact) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
          {/* Compact Date Range Picker */}
          <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-sm">{t("dateRange")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              <span>
                                {digitsEnToFa(
                                  formatDate(field.value.from, locale)
                                )}
                              </span>
                              {" - "}
                              <span dir="rtl">
                                {digitsEnToFa(
                                  formatDate(field.value.to, locale)
                                )}
                              </span>
                            </>
                          ) : (
                            <span>
                              {digitsEnToFa(
                                formatDate(field.value.from, locale)
                              )}
                            </span>
                          )
                        ) : (
                          <span>{digitsEnToFa(t("selectDateRange"))}</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={{
                        from: field.value?.from,
                        to: field.value?.to,
                      }}
                      onSelect={(range) => field.onChange(range || undefined)}
                      className="rounded-lg border shadow-sm"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={ehrByNationalNumber_m.isPending}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {t("updateReport")}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Date Range Picker */}
          <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("dateRange")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              <span>
                                {digitsEnToFa(
                                  formatDate(field.value.from, locale)
                                )}
                              </span>
                              {" - "}
                              <span dir="rtl">
                                {digitsEnToFa(
                                  formatDate(field.value.to, locale)
                                )}
                              </span>
                            </>
                          ) : (
                            <span>
                              {digitsEnToFa(
                                formatDate(field.value.from, locale)
                              )}
                            </span>
                          )
                        ) : (
                          <span>{digitsEnToFa(t("selectDateRange"))}</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={{
                        from: field.value?.from,
                        to: field.value?.to,
                      }}
                      onSelect={(range) => field.onChange(range || undefined)}
                      className="rounded-lg border shadow-sm"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={ehrByNationalNumber_m.isPending}
            className="w-full flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {t("generateReport")}
          </Button>
        </form>
      </Form>
    </div>
  );
};
