"use client";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { LIST_SBHM_QUERY_KEY } from "@/data/saderat-bank-health-monitoring/api";
import { useUploadExcelApi } from "@/data/saderat-bank-health-monitoring/api/upload-excel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string(),
  file: z.instanceof(File),
});

type FormValues = z.infer<typeof formSchema>;

const UploadSaderatBankHealthMonitoringExcelDialog = ({
  trigger,
}: {
  trigger?: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations("/console/saderat-bank-health-monitoring.UploadSaderatBankHealthMonitoringExcelDialog");

  const { mutate: uploadExcel, isPending } = useUploadExcelApi();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = React.useCallback((data: FormValues) => {
    uploadExcel(
      {
        payload: data,
      },
      {
        onSuccess: () => {
          toast.success(t("SuccessMessage"));
          form.reset();
          queryClient.invalidateQueries({
            queryKey: LIST_SBHM_QUERY_KEY(),
          });
          setOpen(false);
        },
        onError: (error) => {
          console.log({ error });
          // Get the list of valid form fields from the schema
          const validFields = Object.keys(formSchema.shape);
          
          Object.entries(error.response?.data || {}).forEach(
            ([field, message]) => {
              // Only set error if the field exists in the form schema
              if (validFields.includes(field)) {
                form.setError(field as keyof FormValues, {
                  type: "server",
                  message: Array.isArray(message) ? message[0] : message,
                });
              }
            }
          );
        },
      }
    );
  },[form, queryClient, uploadExcel, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("DialogTitle")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Form.NameLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("Form.NamePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Form.FileLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={(e) => field.onChange(e.target.files?.[0])}
                      accept=".xlsx,.xls"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner />}
              {t("Form.UploadButton")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadSaderatBankHealthMonitoringExcelDialog;
