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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { LIST_SBHM_QUERY_KEY } from "@/data/saderat-bank-health-monitoring/api";
import { useUploadExcelApi } from "@/data/saderat-bank-health-monitoring/api/upload-excel";
import {
  SBHM_TYPES,
  SBHM_TYPE_LABEL_KEY,
} from "@/data/saderat-bank-health-monitoring/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string(),
  type: z.enum(SBHM_TYPES),
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
  const tStep = useTranslations("common.SBHM_Step");

  const { mutate: uploadExcel, isPending } = useUploadExcelApi();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  // Server errors that do not map onto a form field (500s, timeouts, `detail`,
  // `non_field_errors`, malformed-sheet messages) have no FormMessage to land
  // in, so they are surfaced here instead of being swallowed.
  const [generalErrors, setGeneralErrors] = React.useState<string[]>([]);

  const onSubmit = React.useCallback((data: FormValues) => {
    setGeneralErrors([]);
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
          // Get the list of valid form fields from the schema
          const validFields = Object.keys(formSchema.shape);
          const unmatched: string[] = [];

          const entries = Object.entries(error.response?.data || {});
          entries.forEach(([field, message]) => {
            const text = Array.isArray(message) ? message[0] : message;
            // Only set error if the field exists in the form schema
            if (validFields.includes(field)) {
              form.setError(field as keyof FormValues, {
                type: "server",
                message: text,
              });
            } else {
              unmatched.push(String(text));
            }
          });

          // A transport-level failure (500, timeout, network) carries no
          // response body at all, so it would otherwise produce silence.
          if (entries.length === 0) {
            unmatched.push(error.message || t("ErrorMessage"));
          }

          setGeneralErrors(unmatched);
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

        {generalErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>{t("ErrorTitle")}</AlertTitle>
            <AlertDescription>
              {generalErrors.length === 1 ? (
                generalErrors[0]
              ) : (
                <ul className="list-disc ps-4">
                  {generalErrors.map((message, i) => (
                    <li key={i}>{message}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tStep("Label")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={tStep("Placeholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SBHM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {tStep(SBHM_TYPE_LABEL_KEY(type))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
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
