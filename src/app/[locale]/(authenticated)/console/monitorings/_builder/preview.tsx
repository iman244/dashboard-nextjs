"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  SchemaForm,
  emptyValues,
  type FieldSchema,
  type SchemaFormValues,
} from "@/components/schema-form";

/**
 * The form as an operator will see it, rendered live from the draft.
 *
 * It uses `SchemaForm` -- the very component the real entry screen uses -- so
 * what is shown here cannot drift from what gets built. Picking an image only
 * queues it, and uploading happens on the real form's submit, which this
 * preview does not have -- so nothing here ever leaves the browser.
 */
export const SchemaPreview = ({ schema }: { schema: FieldSchema }) => {
  const t = useTranslations("/console/monitorings.Builder");
  const [values, setValues] = React.useState<SchemaFormValues>(emptyValues);
  return (
    <div className="border-border bg-muted/30 space-y-4 rounded-lg border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Eye className="size-4" aria-hidden="true" />
        {t("PreviewTitle")}
      </div>
      <p className="text-muted-foreground text-xs">{t("PreviewNote")}</p>

      <div className="bg-background space-y-6 rounded-md p-4">
        {/* national_id is structural, not a declared field -- it identifies
            the entry. Shown so the preview matches the real screen. */}
        <div className="space-y-2">
          <Label htmlFor="preview-national-id">{t("NationalId")}</Label>
          <Input
            id="preview-national-id"
            dir="ltr"
            inputMode="numeric"
            disabled
            placeholder="0012345678"
          />
          <p className="text-muted-foreground text-xs">
            {t("NationalIdNote")}
          </p>
        </div>

        <SchemaForm
          schema={schema}
          values={values}
          onChange={setValues}
        />
      </div>
    </div>
  );
};
