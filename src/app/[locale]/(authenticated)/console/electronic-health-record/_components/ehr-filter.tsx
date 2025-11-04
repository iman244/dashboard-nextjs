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
import { Search, Filter, X } from "lucide-react";
import { useElectronicHealthRecord } from "../provider";
import { digitsEnToFa } from "@persian-tools/persian-tools";
import { DateRangePicker } from "@/components/app/date-range-picker";
import { PatientTypeSelector } from "@/components/app/patient-type-selector";

interface EHRFilterProps {
  isLoading?: boolean;
}

// Form schema using Zod
const formSchema = z.object({
  nationalNumber: z.string().default("").optional(),
  patientType: z.string().min(1, "Patient type is required"),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional()
    .nullable(),
});

export type FormValues = z.infer<typeof formSchema>;

/**
 * EHR Filter Component
 * Provides filtering options for national number, date range, and patient type inside a dialog
 */
export const EHRFilter = ({ isLoading = false }: EHRFilterProps) => {
  const t = useTranslations("EHRFilter");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { setFilters, filters } = useElectronicHealthRecord();

  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: filters,
  });

  const { reset } = form;
  React.useEffect(() => {
    console.log("EHRFilter reset(filters)")

    reset(filters);
  }, [reset, filters]);

  const onSubmit = React.useCallback((data: FormValues) => {
    console.log("EHRFilter onSubmit")

    setFilters(data);
    setIsDialogOpen(false);
  }, [setFilters]);

  const handleClear = React.useCallback(() => {
    console.log("EHRFilter handleClear")

    const clearedFilters = {
      nationalNumber: "",
      patientType: "25", // Default to پاراكلينيك
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
    };
    
    reset(clearedFilters);
    setFilters(clearedFilters);
  }, [reset, setFilters]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter />
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
                        {...field}
                        placeholder={t("nationalNumberPlaceholder")}
                        value={digitsEnToFa(field.value || "")}
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
                className="flex-1 w-full"
              />
            </div>
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
