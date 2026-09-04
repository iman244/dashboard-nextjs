"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { PatientType } from "@/components/app/patient-type-selector";
import type { PersonEhr } from "./use-person-ehr";

/**
 * Jump to the full patient report for this person.
 *
 * Carries the window these results were fetched over rather than a fresh
 * guess, so the report opens on what was just read.
 */
export const PatientReportLink = ({
  ehr,
  nationalId,
}: {
  ehr: PersonEhr;
  nationalId: string;
}) => {
  const t = useTranslations("/console/saderat-bank-health-monitoring.Ehr");

  return (
    <Button asChild variant="outline" size="sm">
      <Link
        href={{
          pathname: "/console/patient-reports",
          query: {
            nationalNumber: nationalId,
            fromDate: ehr.fromDate,
            toDate: ehr.toDate,
            patientType: PatientType.LAB,
          },
        }}
      >
        <ExternalLink aria-hidden="true" className="h-4 w-4" />
        {t("openPatientReport")}
      </Link>
    </Button>
  );
};
