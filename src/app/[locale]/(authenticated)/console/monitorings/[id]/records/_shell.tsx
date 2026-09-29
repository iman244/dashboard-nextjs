"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";
import { LoadingState } from "@/components/app/loading-state";
import { StaffOnly } from "@/components/app/staff-only";
import { Link } from "@/i18n/navigation";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api/list";

/**
 * Header, back link and the loading / not-found states both pages share.
 * Both pages change a record, so their content is staff-only.
 */
export const RecordShell = ({
  monitoringId,
  title,
  description,
  loading,
  missing,
  children,
}: {
  monitoringId: number;
  title: string;
  description?: string;
  loading: boolean;
  missing: boolean;
  children: ReactNode;
}) => {
  const t = useTranslations("/console/monitorings.Records");
  const tLoading = useTranslations("common.Loading");
  const tNav = useTranslations("/console.ConsoleSidebar");
  const locale = useLocale();
  const campaign = useList_MonitoringType_API().data?.find(
    (candidate) => candidate.id === monitoringId
  );
  const recordsHref = `/console/monitorings/${monitoringId}?tab=records`;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <ConsoleBreadcrumbs
            trail={[
              { href: "/console/monitorings", label: tNav("campaigns") },
              {
                href: recordsHref,
                label: campaign
                  ? locale === "fa"
                    ? campaign.name_fa
                    : campaign.name_en
                  : t("PageTitle"),
              },
            ]}
          />
        }
        title={title}
        description={description}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href={recordsHref}>
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("BackToRecords")}
            </Link>
          </Button>
        }
      />
      {loading ? (
        <LoadingState label={tLoading("record")} />
      ) : missing ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>{t("RecordNotFound")}</AlertTitle>
        </Alert>
      ) : (
        <StaffOnly>{children}</StaffOnly>
      )}
    </div>
  );
};
