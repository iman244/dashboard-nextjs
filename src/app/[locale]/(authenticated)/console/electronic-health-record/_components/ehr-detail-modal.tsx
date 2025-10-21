import React, { useState } from "react";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCellValue } from "../_utils/format-numbers";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Check, XIcon } from "lucide-react";

interface EHRDetailModalProps {
  record: ElectronicHealthRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

interface CopyButtonProps {
  value: string;
  className?: string;
}

const CopyButton = ({ value, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("Application");
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={`h-6 w-6 p-0 ${className}`}
      title={copied ? t("copied") : t("copy")}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
};

export const EHRDetailModal = ({
  record,
  isOpen,
  onClose,
}: EHRDetailModalProps) => {
  const locale = useLocale();
  const t = useTranslations("EHRDetailModal");

  if (!record) return null;

  const detailFields = [
    {
      label: t("fields.patientName"),
      value: `${record["نام بيمار"]} ${record["نام خانوادگي بيمار"]}`,
    },
    { label: t("fields.nationalId"), value: record["كدملي"] },
    { label: t("fields.date"), value: record["تاريخ"] },
    { label: t("fields.serviceName"), value: record["نام خدمت"] },
    { label: t("fields.treatingPhysician"), value: record["نام پزشك معالج"] },
    { label: t("fields.location"), value: record["مكان"] },
    { label: t("fields.patientType"), value: record.PatientType },
    { label: t("fields.age"), value: `${record["سن"]} ${record["نوع سن"]}` },
    { label: t("fields.patientCode"), value: record["كد بيمار"] },
    { label: t("fields.recordNumber"), value: record["شماره پرونده"] },
    { label: t("fields.admissionCode"), value: record["كد پذيرش"] },
    { label: t("fields.serviceCode"), value: record["كد خدمت"] },
    { label: t("fields.nationalServiceCode"), value: record["كد ملي خدمت"] },
    { label: t("fields.physicianCode"), value: record["كد پزشك معالج"] },
    { label: t("fields.physicianSystem"), value: record["نظام پزشكي معالج"] },
    { label: t("fields.locationCode"), value: record["كد مكان"] },
    { label: t("fields.inquiryCode"), value: record["كد استعلام"] },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-right">{t("title")}</DialogTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Badge variant="outline">
                  {record.PatientType === "بستری"
                    ? t("patientTypes.inpatient")
                    : t("patientTypes.outpatient")}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline">{record["مكان"]}</Badge>
              </div>
            </div>
          </div>
              <DialogClose asChild>
                <Button variant={"ghost"} size="icon" className="absolute top-4 left-4 size-2">
                  <XIcon className="h-2 w-2" />
                </Button>
              </DialogClose>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right border-b pb-2">
              {t("sections.patientInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detailFields.slice(0, 7).map((field) => (
                <div key={field.label} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm flex-1">
                      {formatCellValue(field.value, locale)}
                    </div>
                    <CopyButton value={String(field.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right border-b pb-2">
              {t("sections.medicalInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detailFields.slice(7).map((field) => (
                <div key={field.label} className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm flex-1">
                      {formatCellValue(field.value, locale)}
                    </div>
                    <CopyButton value={String(field.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
