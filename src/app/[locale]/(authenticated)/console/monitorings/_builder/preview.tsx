"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  SchemaForm,
  emptyValues,
  type AttachedImage,
  type FieldSchema,
  type SchemaFormValues,
} from "@/components/schema-form";

/**
 * The form as an operator will see it, rendered live from the draft.
 *
 * It uses `SchemaForm` -- the very component the real entry screen uses -- so
 * what is shown here cannot drift from what gets built. The one difference is
 * where images go: there is no monitoring and no patient yet, so a picked file
 * becomes a local blob URL instead of an S3 object. Everything else, including
 * the digits-only filtering and the length messages, behaves for real.
 */
export const SchemaPreview = ({ schema }: { schema: FieldSchema }) => {
  const t = useTranslations("/console/monitorings.Builder");
  const [values, setValues] = React.useState<SchemaFormValues>(emptyValues);
  const urls = React.useRef<string[]>([]);

  React.useEffect(() => {
    const created = urls.current;
    // Blob URLs outlive the element that used them; release them when the
    // builder unmounts or the browser holds the files for the whole session.
    return () => {
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const onAddImage = React.useCallback(async (_field: unknown, file: File) => {
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    const attached: AttachedImage = {
      id: `${file.name}-${crypto.randomUUID()}`,
      name: file.name,
      url,
    };
    return attached;
  }, []);

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
          onAddImage={onAddImage}
        />
      </div>
    </div>
  );
};
