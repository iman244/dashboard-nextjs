"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { CalendarIcon, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns-jalali";
import { DayPicker } from "react-day-picker/persian";
import { type DateRange } from "react-day-picker";
import { useElectronicHealthRecord } from "../provider";
import Calendar04 from "@/components/calendar-04";
import { Calendar } from "@/components/ui/calendar";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { formatDate } from "../_utils/format-date";

interface EHRFilterProps {
  isLoading?: boolean;
}

// Form schema using Zod
const formSchema = z.object({
  nationalNumber: z.string().optional(),
  patientType: z.string().min(1, "Patient type is required"),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional()
    .nullable(),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * EHR Filter Component
 * Provides filtering options for national number, date range, and patient type inside a dialog
 */
export const EHRFilter = ({ isLoading = false }: EHRFilterProps) => {
  const t = useTranslations("EHRFilter");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { setFilters } = useElectronicHealthRecord();
  const locale = useLocale();
  // Patient type options (you can customize these based on your requirements)
  const patientTypeOptions = [{ value: "2", label: "نوع بیمار 2" }];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationalNumber: "",
      patientType: "2",
      dateRange: null,
    },
  });
  const { watch } = form;
  const dateRange = watch("dateRange");
  React.useEffect(() => {
    console.log({ dateRange });
  }, [dateRange]);

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted with data:", {
      nationalNumber: data.nationalNumber,
      fromDate: data.dateRange?.from
        ? format(data.dateRange.from, "yyyy MMMM dd")
        : "",
      toDate: data.dateRange?.to
        ? format(data.dateRange.to, "yyyy MMMM dd")
        : "",
      patientType: data.patientType,
    });

    // Uncomment when ready to use filters
    // setFilters({
    //   nationalNumber: data.nationalNumber || "",
    //   fromDate: data.dateRange?.from ? format(data.dateRange.from, "yyyy MMMM dd") : "",
    //   toDate: data.dateRange?.to ? format(data.dateRange.to, "yyyy MMMM dd") : "",
    //   patientType: data.patientType,
    // });

    setIsDialogOpen(false);
  };

  const handleClear = () => {
    form.reset({
      nationalNumber: "",
      patientType: "2",
      dateRange: null,
    });

    const clearedFilters = {
      nationalNumber: "",
      fromDate: "",
      toDate: "",
      patientType: "25",
    };
    setFilters(clearedFilters);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px]"
        dir="rtl"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-2">
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </div>

          <DialogClose asChild>
            <Button variant="outline" size={"icon"}>
              <X />
            </Button>
          </DialogClose>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* National Number Input */}
            <div className="flex items-center gap-2 sm:flex-row flex-col">
              <FormField
                control={form.control}
                name="nationalNumber"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>{t("nationalNumber")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("nationalNumberPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Patient Type Selector */}
              <FormField
                control={form.control}
                name="patientType"
                render={({ field }) => (
                  <FormItem className="flex-1 w-full">
                    <FormLabel>{t("patientType")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("selectPatientType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patientTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                        onSelect={(range) => field.onChange(range || null)}
                        className="rounded-lg border shadow-sm"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={isLoading}
              >
                {t("clear")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {t("search")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
