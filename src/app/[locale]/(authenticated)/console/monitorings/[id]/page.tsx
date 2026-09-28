"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Inbox, Info, Pencil, Trash, Upload } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";
import { LoadingState } from "@/components/app/loading-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api/list";
import { useList_SBHM_API } from "@/data/saderat-bank-health-monitoring/api";
import type { SBHM_ListSerializer } from "@/data/saderat-bank-health-monitoring/types";
import { useIsStaff } from "@/data/user/fetches/me";
import { campaignUploads, pickUpload } from "@/lib/campaign";
import { CAMPAIGN_PATIENT_PATH } from "@/lib/national-id";
import { useDirection } from "@/lib/use-direction";
import { formatDate, localeDigits } from "@/lib/utils";
import DeleteSaderatBankHealthMonitoringExcelDialog from "../../saderat-bank-health-monitoring/_delete-excel-dialog/dialog";
import { Step1Report } from "../_reports/step-1-report";
import { Step2Report } from "../_reports/step-2-report";
import { UploadRowsTable } from "../_reports/rows-table";
import { RecordsPanel } from "./_records-panel";

type UploadItem = SBHM_ListSerializer[number];

/**
 * One campaign: its Excel uploads, one at a time, and its form records.
 *
 * Readable by every console user; the edit, upload and delete controls are
 * staff-only, as Django enforces. The tab and the chosen upload live in the
 * URL (`?tab=`, `?upload=`), so a view can be shared or reopened.
 */
export default function CampaignPage(
  props: PageProps<"/[locale]/console/monitorings/[id]">
) {
  const { id } = React.use(props.params);
  const campaignId = Number(id);

  const t = useTranslations("/console/monitorings.Campaign");
  const tTypes = useTranslations("/console/monitorings.MonitoringTypesPage");
  const tUploads = useTranslations(
    "/console/saderat-bank-health-monitoring.SaderatBankHealthMonitoringPage"
  );
  const tNav = useTranslations("/console.ConsoleSidebar");
  const tLoading = useTranslations("common.Loading");
  const locale = useLocale();
  const dir = useDirection();
  const isStaff = useIsStaff();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const types = useList_MonitoringType_API();
  const campaign = types.data?.find((candidate) => candidate.id === campaignId);
  const uploadList = useList_SBHM_API();
  const uploads = React.useMemo(
    () => (campaign ? campaignUploads(uploadList.data ?? [], campaign.slug) : []),
    [uploadList.data, campaign]
  );
  const requested = searchParams.get("upload");
  const { selected, requestedMissing } = pickUpload(uploads, requested);

  // Stable, so the Step 2 sheet does not rebuild its columns every render.
  const personHref = React.useCallback(
    (nid: string) => CAMPAIGN_PATIENT_PATH(campaignId, nid),
    [campaignId]
  );

  const replaceParam = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) params.delete(key);
      else params.set(key, value);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // The dialog's target is kept after it closes, so the name does not change
  // under its closing animation, and so a finished delete can be recognised.
  const [deleteTarget, setDeleteTarget] = React.useState<UploadItem | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  // The URL still names the upload just deleted. That is not the "wrong
  // upload" case the notice is for: drop the parameter, and the newest
  // remaining upload (or the empty state) shows.
  const deletedRequested =
    deleteTarget !== null &&
    requested === String(deleteTarget.id) &&
    uploadList.isSuccess &&
    !uploads.some((upload) => upload.id === deleteTarget.id);
  React.useEffect(() => {
    if (deletedRequested) replaceParam("upload", null);
  }, [deletedRequested, replaceParam]);

  const tab = searchParams.get("tab") === "records" ? "records" : "uploads";
  const name = campaign ? (locale === "fa" ? campaign.name_fa : campaign.name_en) : "";
  const breadcrumbs = (
    <ConsoleBreadcrumbs parent={{ href: "/console/monitorings", label: tNav("campaigns") }} />
  );
  const uploadHref = `/console/monitorings/upload?campaign=${campaignId}`;

  if (types.isPending) {
    return <LoadingState label={tLoading("monitoringTypes")} />;
  }

  if (types.error) {
    return (
      <div className="space-y-4">
        <PageHeader breadcrumbs={breadcrumbs} title={tTypes("PageTitle")} />
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" className="size-4" />
          <AlertTitle>{tTypes("ErrorTitle")}</AlertTitle>
          <AlertDescription>{types.error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <PageHeader breadcrumbs={breadcrumbs} title={t("notFound")} />
        <Alert>
          <AlertCircle aria-hidden="true" className="size-4" />
          <AlertTitle>{t("notFound")}</AlertTitle>
          <AlertDescription>
            <Link href="/console/monitorings" className="underline underline-offset-4">
              {t("backToList")}
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const uploadsBody = () => {
    if (uploadList.isPending) {
      return <LoadingState label={tLoading("default")} />;
    }

    if (uploadList.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" className="size-4" />
          <AlertTitle>{tUploads("ErrorTitle")}</AlertTitle>
          <AlertDescription>{uploadList.error.message}</AlertDescription>
        </Alert>
      );
    }

    if (!selected) {
      return (
        <Alert>
          <Inbox aria-hidden="true" className="size-4" />
          <AlertTitle>{t("noUploads")}</AlertTitle>
          {isStaff ? (
            <AlertDescription>
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href={uploadHref}>
                  <Upload aria-hidden="true" className="size-4" />
                  {t("uploadExcel")}
                </Link>
              </Button>
            </AlertDescription>
          ) : null}
        </Alert>
      );
    }

    const reportProps = { uploadId: selected.id, personHref };

    return (
      <div className="space-y-4">
        {requestedMissing && !deletedRequested ? (
          <Alert>
            <Info aria-hidden="true" className="size-4" />
            <AlertDescription>{t("uploadMissing")}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-end gap-2">
          <div className="grid min-w-0 flex-1 gap-2 sm:w-80 sm:flex-none">
            <Label htmlFor="campaign-upload">{t("chooseUpload")}</Label>
            <Select
              dir={dir}
              value={String(selected.id)}
              onValueChange={(value) => replaceParam("upload", value)}
            >
              <SelectTrigger id="campaign-upload" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {uploads.map((upload) => (
                  <SelectItem key={upload.id} value={String(upload.id)}>
                    {`${localeDigits(upload.name, locale)} · ${localeDigits(
                      formatDate(new Date(upload.created_at), locale),
                      locale
                    )}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isStaff ? (
            <Button
              variant="outline"
              size="icon"
              aria-label={t("deleteUpload")}
              title={t("deleteUpload")}
              onClick={() => {
                setDeleteTarget(selected);
                setDeleting(true);
              }}
            >
              <Trash aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
        </div>

        {campaign.slug === "step_1" ? (
          <Step1Report key={selected.id} {...reportProps} />
        ) : campaign.slug === "step_2" ? (
          <Step2Report key={selected.id} {...reportProps} />
        ) : (
          <UploadRowsTable key={selected.id} {...reportProps} />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={name}
        actions={
          isStaff ? (
            <>
              <Button variant="outline" asChild>
                <Link href={`/console/monitorings/${campaignId}/edit`}>
                  <Pencil aria-hidden="true" className="size-4" />
                  {t("editDefinition")}
                </Link>
              </Button>
              <Button asChild>
                <Link href={uploadHref}>
                  <Upload aria-hidden="true" className="size-4" />
                  {t("uploadExcel")}
                </Link>
              </Button>
            </>
          ) : undefined
        }
      />

      <Tabs dir={dir} value={tab} onValueChange={(value) => replaceParam("tab", value)}>
        <TabsList>
          <TabsTrigger value="uploads">{t("uploadsTab")}</TabsTrigger>
          <TabsTrigger value="records">{t("recordsTab")}</TabsTrigger>
        </TabsList>
        <TabsContent value="uploads">{uploadsBody()}</TabsContent>
        <TabsContent value="records">
          <RecordsPanel monitoringId={campaign.id} />
        </TabsContent>
      </Tabs>

      {isStaff ? (
        <DeleteSaderatBankHealthMonitoringExcelDialog
          data={deleteTarget ?? undefined}
          open={deleting}
          onOpenChange={setDeleting}
        />
      ) : null}
    </div>
  );
}
