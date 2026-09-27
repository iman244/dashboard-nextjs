"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";

/**
 * The header every step report renders, in every state.
 *
 * The empty, error and wrong-step states used to return a bare message with
 * no title and no way back, so an upload with no rows was a dead end. The
 * breadcrumb to the upload list now sits above all of them.
 */
export function ReportFrame({
  title,
  description,
  actions,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.SaderatBankHealthMonitoringPage"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <ConsoleBreadcrumbs
            parent={{
              href: "/console/saderat-bank-health-monitoring",
              label: t("PageTitle"),
            }}
          />
        }
        title={title}
        description={description}
        actions={actions}
      />
      {children}
    </div>
  );
}
