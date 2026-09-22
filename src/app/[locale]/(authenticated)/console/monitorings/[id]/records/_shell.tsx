"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { LoadingState } from "@/components/app/loading-state";
import { Link } from "@/i18n/navigation";

/** Header, back link and the loading / not-found states both pages share. */
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/console/monitorings/${monitoringId}/records`}>
              <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
              {t("BackToRecords")}
            </Link>
          </Button>
        }
      />
      {loading ? (
        <LoadingState label={tLoading("Loading")} />
      ) : missing ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>{t("RecordNotFound")}</AlertTitle>
        </Alert>
      ) : (
        children
      )}
    </div>
  );
};
