import React, { useState } from "react";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCellValue } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Check, XIcon, DownloadIcon } from "lucide-react";
import { useElectronicHealthRecord } from "../provider";
import { _5_160_115_210_ADDRESS } from "@/settings";
import { toast } from "sonner";

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
  const {
    mobileLaboratoryByNationalNumber_m,
    mobileXRayByNationalNumber_m,
    mobileNumberByNationalNumber_m,
  } = useElectronicHealthRecord();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadXRayUrl, setDownloadXRayUrl] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string | null>(null);

  React.useEffect(() => {
    setDownloadUrl(null);
    setDownloadXRayUrl(null);
    setMobileNumber(null);
  }, [isOpen]);

  const handleDownloadResult = React.useCallback(
    (record: ElectronicHealthRecord) => {
      mobileLaboratoryByNationalNumber_m.mutate(
        {
          params: {
            nationalNumber: record["كدملي"],
            receptionID: record["كد استعلام"].toString(),
          },
        },
        {
          onSuccess(data) {
            const dl = _5_160_115_210_ADDRESS + data;
            window.open(dl, "_blank");
            setDownloadUrl(dl);
          },
          onError: (error) => {
            console.error("error", error);
            toast.error(t("error.mobileLaboratoryByNationalNumber"));
          },
        }
      );
    },
    [mobileLaboratoryByNationalNumber_m, t]
  );

  const handleDownloadXRay = React.useCallback(
    (record: ElectronicHealthRecord) => {
      mobileXRayByNationalNumber_m.mutate(
        {
          params: {
            nationalNumber: record["كدملي"],
            receptionID: record["كد استعلام"].toString(),
          },
        },
        {
          onSuccess(data) {
            const dl = _5_160_115_210_ADDRESS + data;
            window.open(dl, "_blank");
            setDownloadXRayUrl(dl);
          },
          onError: (error) => {
            console.error("error", error);
            toast.error(t("error.mobileXRayByNationalNumber"));
          },
        }
      );
    },
    [mobileXRayByNationalNumber_m, t]
  );

  const handleGetMobileNumber = React.useCallback(
    (record: ElectronicHealthRecord) => {
      mobileNumberByNationalNumber_m.mutate(
        {
          params: {
            nationalNumber: record["كدملي"],
          },
        },
        {
          onSuccess(data) {
            setMobileNumber(data[0].MobileNumber);
          },
          onError: (error) => {
            console.error("error", error);
            toast.error(t("error.mobileNumberByNationalNumber"));
          },
        }
      );
    },
    [mobileNumberByNationalNumber_m, t]
  );

  if (!record) return null;

  const patientInfoFields = [
    {
      label: t("fields.patientName"),
      value: `${record["نام بيمار"]} ${record["نام خانوادگي بيمار"]}`,
    },
    { label: t("fields.nationalId"), value: record["كدملي"] },
    { label: t("fields.age"), value: `${record["سن"]} ${record["نوع سن"]}` },
    { label: t("fields.patientType"), value: record.PatientType },
    { label: t("fields.patientCode"), value: record["كد بيمار"] },
    { label: t("fields.recordNumber"), value: record["شماره پرونده"] },
  ];

  const medicalInfoFields = [
    { label: t("fields.serviceName"), value: record["نام خدمت"] },
    { label: t("fields.treatingPhysician"), value: record["نام پزشك معالج"] },
    { label: t("fields.location"), value: record["مكان"] },
    { label: t("fields.date"), value: record["تاريخ"] },
    { label: t("fields.admissionCode"), value: record["كد پذيرش"] },
    { label: t("fields.serviceCode"), value: record["كد خدمت"] },
    { label: t("fields.nationalServiceCode"), value: record["كد ملي خدمت"] },
    { label: t("fields.physicianCode"), value: record["كد پزشك معالج"] },
    { label: t("fields.physicianSystem"), value: record["نظام پزشكي معالج"] },
    { label: t("fields.locationCode"), value: record["كد مكان"] },
  ];

  const answerFields = [
    { label: t("fields.inquiryCode"), value: record["كد استعلام"] },
    { label: t("fields.answer"), value: record["جواب"] },
    { label: t("fields.normalRange"), value: record["نرمال رنج"] },
    {
      label: t("fields.receptionServiceId"),
      value: record["ReceptionServiceID"],
    },
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
            <DialogClose asChild>
              <Button
                variant={"ghost"}
                size="icon"
                className="absolute top-6 left-4 size-2"
              >
                <XIcon className="h-2 w-2" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Info Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold text-right">
                {t("sections.patientInfo")}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patientInfoFields.map((field) => (
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
              <div key={"mobileNumber"} className="space-y-1 flex flex-col gap-1">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("fields.mobileNumber")}
                </label>
                {mobileNumber ? (
                  <div className="flex items-center gap-1">
                    <div className="text-sm flex-1">
                      {formatCellValue(mobileNumber, locale)}
                    </div>
                    <CopyButton value={String(mobileNumber)} />
                  </div>
                ) : (
                  <Button
                    variant={"ghost"}
                    size="sm"
                    onClick={() => handleGetMobileNumber(record)}
                    disabled={mobileNumberByNationalNumber_m.isPending}
                    className="w-fit"
                  >
                    {t("getMobileNumber")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Medical Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right border-b pb-2">
              {t("sections.medicalInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalInfoFields.map((field) => (
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

          {/* Answer & Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold text-right">
                {t("sections.answer")}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={"outline"}
                  size="sm"
                  onClick={() => {
                    if (downloadUrl) {
                      window.open(downloadUrl, "_blank");
                    } else {
                      handleDownloadResult(record);
                    }
                  }}
                  disabled={mobileLaboratoryByNationalNumber_m.isPending}
                  className="h-8 px-3"
                >
                  <DownloadIcon className="h-3 w-3 ml-1" />
                  {t("downloadResult")}
                </Button>
                <Button
                  variant={"outline"}
                  size="sm"
                  onClick={() => {
                    if (downloadXRayUrl) {
                      window.open(downloadXRayUrl, "_blank");
                    } else {
                      handleDownloadXRay(record);
                    }
                  }}
                  disabled={mobileXRayByNationalNumber_m.isPending}
                  className="h-8 px-3"
                >
                  <DownloadIcon className="h-3 w-3 ml-1" />
                  {t("downloadXRay")}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {answerFields.map((field) => (
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
