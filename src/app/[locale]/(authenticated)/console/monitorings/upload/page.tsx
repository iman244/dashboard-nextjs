"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";
import { StaffOnly } from "@/components/app/staff-only";
import { UploadExcelForm } from "./_form";

/**
 * Upload used to be a dialog opened from the campaign list; it is its own
 * page now, so it can be linked to (`?campaign=<id>`) and can show a result
 * panel instead of just closing. Any campaign can be picked here, not only
 * the ones with a detail view.
 */
const UploadExcelPage = () => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.UploadSaderatBankHealthMonitoringExcelDialog"
  );
  const tNav = useTranslations("/console.ConsoleSidebar");

  return (
    <StaffOnly>
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={
            <ConsoleBreadcrumbs
              parent={{ href: "/console/monitorings", label: tNav("campaigns") }}
            />
          }
          title={t("PageTitle")}
        />
        <UploadExcelForm />
      </div>
    </StaffOnly>
  );
};

export default UploadExcelPage;
