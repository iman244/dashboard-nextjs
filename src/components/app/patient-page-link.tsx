"use client";

import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { PATIENT_PATH } from "@/lib/national-id";

/** "Patient page" for a person shown inside some other view. */
export const PatientPageLink = ({ nationalId }: { nationalId: string }) => {
  const t = useTranslations("common.Dictionary");
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={PATIENT_PATH(nationalId)}>
        <User aria-hidden="true" className="size-4" />
        {t("PatientPage")}
      </Link>
    </Button>
  );
};
