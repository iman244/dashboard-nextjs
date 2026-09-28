"use client";

import { Button } from "@/components/ui/button";
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
import { LoadingState } from "@/components/app/loading-state";
import { refreshUploads } from "@/data/saderat-bank-health-monitoring/refresh";
import {
  useUploadExcelApi,
  type UploadIssue,
} from "@/data/saderat-bank-health-monitoring/api/upload-excel";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api";
import type {
  MonitoringType,
  MonitoringType_ListSerializer,
} from "@/data/monitoring-type/types";
import { UploadIssues } from "./_issues";
import { localeDigits } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string(),
  type: z.string().min(1),
  file: z.instanceof(File),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * The `?campaign=` query param, plus the campaign list, resolve to a slug
 * before this component's `useForm` ever mounts: `defaultValues` are only
 * read once, so the form has to be built *after* the match is known rather
 * than patched afterwards.
 */
export function UploadExcelForm() {
  const searchParams = useSearchParams();
  const types = useList_MonitoringType_API();
  const tLoading = useTranslations("common.Loading");
  const tTypes = useTranslations("/console/monitorings.MonitoringTypesPage");

  if (types.isPending) {
    return <LoadingState label={tLoading("monitoringTypes")} />;
  }

  if (types.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {tTypes("ErrorTitle")}
      </p>
    );
  }

  return (
    <UploadExcelFormReady
      campaigns={types.data}
      campaignParam={searchParams.get("campaign")}
    />
  );
}

function UploadExcelFormReady({
  campaigns,
  campaignParam,
}: {
  campaigns: MonitoringType_ListSerializer;
  campaignParam: string | null;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.UploadSaderatBankHealthMonitoringExcelDialog"
  );
  const tStep = useTranslations("common.SBHM_Step");
  const locale = useLocale();

  const preselected = campaignParam
    ? campaigns.find((type) => String(type.id) === campaignParam)
    : undefined;

  const { mutate: uploadExcel, isPending: isUploading } = useUploadExcelApi();
  // The upload is saved, and the lists it changed are being refetched before
  // the campaign page opens; the button stays busy through both.
  const [refreshing, setRefreshing] = React.useState(false);
  const isPending = isUploading || refreshing;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: preselected?.slug ?? "" },
  });
  // Server errors that do not map onto a form field (500s, timeouts, `detail`,
  // `non_field_errors`, malformed-sheet messages) have no FormMessage to land
  // in, so they are surfaced here instead of being swallowed.
  const [generalErrors, setGeneralErrors] = React.useState<string[]>([]);
  // A refusal carries structured issues (only ever the unreadable-file one),
  // which read better as sentences than as a raw field error.
  const [refusedIssues, setRefusedIssues] = React.useState<UploadIssue[] | null>(
    null
  );
  // A save with warnings does not navigate away, so the form is replaced with
  // this instead of the campaign page.
  const [savedResult, setSavedResult] = React.useState<{
    campaign: MonitoringType;
    uploadId: number;
    issues: UploadIssue[];
  } | null>(null);

  const openUploadPath = (campaign: MonitoringType, uploadId: number) =>
    `/console/monitorings/${campaign.id}?upload=${uploadId}`;

  const onSubmit = React.useCallback(
    (data: FormValues) => {
      setGeneralErrors([]);
      setRefusedIssues(null);
      uploadExcel(
        { payload: data },
        {
          onSuccess: async (result) => {
            toast.success(t("SuccessMessage"));
            // Awaited: the campaign page would otherwise open on the cached
            // list, which lacks the new upload and says it is not there.
            setRefreshing(true);
            await refreshUploads(queryClient);
            const campaign = campaigns.find((type) => type.slug === data.type);
            if (!campaign || result.issues.length > 0) setRefreshing(false);
            if (!campaign) return;
            if (result.issues.length > 0) {
              setSavedResult({ campaign, uploadId: result.id, issues: result.issues });
            } else {
              router.push(openUploadPath(campaign, result.id));
            }
          },
          onError: (error) => {
            const body = error.response?.data as
              | { issues?: UploadIssue[]; [field: string]: unknown }
              | undefined;

            if (body?.issues && body.issues.length > 0) {
              setRefusedIssues(body.issues);
              return;
            }

            // Get the list of valid form fields from the schema
            const validFields = Object.keys(formSchema.shape);
            const unmatched: string[] = [];

            const entries = Object.entries(body || {});
            entries.forEach(([field, message]) => {
              const text = Array.isArray(message) ? message[0] : message;
              // Only set error if the field exists in the form schema
              if (validFields.includes(field)) {
                form.setError(field as keyof FormValues, {
                  type: "server",
                  message: String(text),
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
    },
    [campaigns, form, queryClient, router, t, uploadExcel]
  );

  const uploadAnother = () => {
    setSavedResult(null);
    setGeneralErrors([]);
    setRefusedIssues(null);
    form.reset();
  };

  if (savedResult) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTitle>
            {t("savedWithIssues", {
              count: localeDigits(savedResult.issues.length, locale),
            })}
          </AlertTitle>
          <AlertDescription>
            <UploadIssues issues={savedResult.issues} campaigns={campaigns} />
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              router.push(openUploadPath(savedResult.campaign, savedResult.uploadId))
            }
          >
            {t("openUpload")}
          </Button>
          <Button variant="outline" onClick={uploadAnother}>
            {t("uploadAnother")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {refusedIssues && (
        <Alert variant="destructive">
          <AlertTitle>{t("refusedTitle")}</AlertTitle>
          <AlertDescription>
            <UploadIssues issues={refusedIssues} campaigns={campaigns} />
          </AlertDescription>
        </Alert>
      )}

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
                  value={field.value ?? ""}
                  disabled={!campaigns.length}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={tStep("Placeholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {campaigns.map((type) => (
                      <SelectItem key={type.id} value={type.slug}>
                        {locale === "fa" ? type.name_fa : type.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!campaigns.length && (
                  <p role="status">{t("NoSupportedTypes")}</p>
                )}
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
          <Button type="submit" disabled={isPending || !campaigns.length} aria-busy={isPending}>
            {isPending && <Spinner />}
            {t("Form.UploadButton")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
