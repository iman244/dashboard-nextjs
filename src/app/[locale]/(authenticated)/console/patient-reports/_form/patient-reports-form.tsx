"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CalendarIcon, Search } from "lucide-react";
import { usePatientReports } from "../provider";
import { digitsEnToFa, digitsFaToEn } from "@persian-tools/persian-tools";
import { format, newDate } from "date-fns-jalali";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogDescription } from "@radix-ui/react-dialog";
import { DateRangePicker } from "@/components/app/date-range-picker";
import { PatientTypeSelector } from "@/components/app/patient-type-selector";

// Form schema using Zod
const formSchema = z.object({
  nationalNumber: z.string().min(1, "National number is required"),
  patientType: z.string().min(1, "Patient type is required"),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .refine((data) => data.from <= data.to, {
      message: "End date must be after start date",
      path: ["to"],
    }),
});

export type PatientReportsFormValues = z.infer<typeof formSchema>;

/**
 * Patient Reports Form Component
 * Provides national number and date range selection for patient reports
 */
export const PatientReportsForm = (props: {
  initialValues: { nationalNumber: string; fromDate: string; toDate: string; patientType: string };
  compact?: boolean;
}) => {
  console.log({props})
  const t = useTranslations("PatientReports");
  const { setFilters, ehrByNationalNumber_m } = usePatientReports();
  const locale = useLocale();

  const form = useForm<PatientReportsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationalNumber: props.initialValues.nationalNumber || "",
      patientType: props.initialValues.patientType || "25", // Default to پاراكلينيك
      dateRange: props.initialValues.fromDate && props.initialValues.toDate
        ? {
            from: (() => {
              const [year, month, day] = props.initialValues.fromDate.split('/').map(Number);
              return newDate(year, month - 1, day);
            })(),
            to: (() => {
              const [year, month, day] = props.initialValues.toDate.split('/').map(Number);
              return newDate(year, month - 1, day);
            })(),
          }
        : undefined,
    },
  });
  const { mutate } = ehrByNationalNumber_m;

  const onSubmit = React.useCallback(
    (data: PatientReportsFormValues) => {
      setFilters(data);
      mutate({
        params: {
          nationalNumber: digitsFaToEn(data.nationalNumber),
          fromDate: data.dateRange?.from
            ? format(data.dateRange.from, "yyyy/MM/dd")
            : "",
          toDate: data.dateRange?.to
            ? format(data.dateRange.to, "yyyy/MM/dd")
            : "",
          patientType: data.patientType,
        },
      });
    },
    [setFilters, mutate]
  );

  if (props.compact) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {t("selectPatientAndPeriod")}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <MyForm form={form} onSubmit={onSubmit} />
        </DialogContent>
      </Dialog>
    );
  }

  return <MyForm form={form} onSubmit={onSubmit} />;
};

const MyForm = ({
  form,
  onSubmit,
}: {
  form: UseFormReturn<PatientReportsFormValues>;
  onSubmit: (data: PatientReportsFormValues) => void;
}) => {
  const { ehrByNationalNumber_m } = usePatientReports();
  const t = useTranslations("PatientReports");
  const locale = useLocale();
  
  return (
    <div className="flex-1 flex flex-col gap-6 justify-center items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{t("selectPatientAndPeriod")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-md mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* National Number Input */}
                <FormField
                  control={form.control}
                  name="nationalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("nationalNumber")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t("nationalNumberPlaceholder")}
                          value={digitsEnToFa(field.value || "")}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Patient Type Selector */}
                <PatientTypeSelector
                  control={form.control}
                  name="patientType"
                  label={t("patientType")}
                  placeholder={t("selectPatientType")}
                />

                {/* Date Range Picker */}
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("dateRange")}</FormLabel>
                      <FormControl>
                        <DateRangePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("selectDateRange")}
                        />
                      </FormControl>
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
        </CardContent>
      </Card>
    </div>
  );
};
