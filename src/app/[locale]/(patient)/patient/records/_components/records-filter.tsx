"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Filter, Search, X } from "lucide-react";
import { DateRangePicker } from "@/components/app/date-range-picker";
import { PatientTypeSelector } from "@/components/app/patient-type-selector";
import { usePatientRecords } from "../provider";

/**
 * Note what is absent: there is no national-number field. The console's filter
 * has one; here the id belongs to the session, so exposing it as a filter would
 * be the one thing this page must not do.
 */
const formSchema = z.object({
  patientType: z.string().min(1),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional()
    .nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export const RecordsFilter = ({
  isLoading = false,
}: {
  isLoading?: boolean;
}) => {
  const t = useTranslations("/patient/records.PatientRecords");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { filters, setFilters, resetFilters } = usePatientRecords();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: filters,
  });

  const { reset } = form;
  React.useEffect(() => {
    reset(filters);
  }, [reset, filters]);

  const onSubmit = React.useCallback(
    (data: FormValues) => {
      // zod's .optional().nullable() yields `| null | undefined`. Normalising
      // here keeps PatientRecordsFilters down to one "no range" value instead
      // of widening the domain type to carry the form's two.
      setFilters({
        patientType: data.patientType,
        dateRange: data.dateRange ?? null,
      });
      setIsDialogOpen(false);
    },
    [setFilters]
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter />
          {t("filter.title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-2">
            <DialogTitle>{t("filter.title")}</DialogTitle>
            <DialogDescription>{t("filter.description")}</DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="outline" size="icon">
              <X />
            </Button>
          </DialogClose>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PatientTypeSelector
              control={form.control}
              name="patientType"
              label={t("filter.patientType")}
              placeholder={t("filter.selectPatientType")}
              className="w-full"
            />

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("filter.dateRange")}</FormLabel>
                  <FormControl>
                    <DateRangePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("filter.selectDateRange")}
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
                onClick={resetFilters}
                disabled={isLoading}
              >
                {t("filter.clear")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {t("filter.search")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
