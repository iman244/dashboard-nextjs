"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { DigitStringField } from "./digit-string-field";
import { ImageField, type AttachedImage } from "./image-field";
import {
  DIGIT_STRING,
  groupFields,
  titleOf,
  type FieldSchema,
  type SchemaField,
} from "./types";

export type SchemaFormValues = {
  digits: Record<string, string>;
  images: Record<string, AttachedImage[]>;
};

export const emptyValues = (): SchemaFormValues => ({ digits: {}, images: {} });

/**
 * Renders a whole `field_schema` as a form.
 *
 * One component serves both the schema builder's live preview and the
 * operator's real entry form. That is deliberate: a preview rendered by
 * different code than the real thing is a preview that can lie.
 */
export const SchemaForm = ({
  schema,
  values,
  onChange,
  onAddImage,
  disabled,
  imagesDisabledHint,
  showErrors,
}: {
  schema: FieldSchema;
  values: SchemaFormValues;
  onChange: (next: SchemaFormValues) => void;
  onAddImage: (
    field: SchemaField,
    file: File,
    onProgress: (percent: number) => void
  ) => Promise<AttachedImage>;
  disabled?: boolean;
  /**
   * When set, image pickers are disabled with this explanation while every
   * other field stays usable. Uploads are filed under the patient, so they
   * cannot start before there is one. Disabled, never hidden: a field that
   * appears and disappears as someone types is the bug this replaced.
   */
  imagesDisabledHint?: string;
  showErrors?: boolean;
}) => {
  const t = useTranslations("common.SchemaForm");
  const locale = useLocale();
  const { loose, grouped } = groupFields(schema);

  const renderField = (field: SchemaField) =>
    field.type === DIGIT_STRING ? (
      <DigitStringField
        key={field.key}
        field={field}
        disabled={disabled}
        showErrors={showErrors}
        value={values.digits[field.key] ?? ""}
        onChange={(next) =>
          onChange({
            ...values,
            digits: { ...values.digits, [field.key]: next },
          })
        }
      />
    ) : (
      <ImageField
        key={field.key}
        field={field}
        disabled={disabled || Boolean(imagesDisabledHint)}
        disabledHint={imagesDisabledHint}
        showErrors={showErrors}
        value={values.images[field.key] ?? []}
        onChange={(next) =>
          onChange({
            ...values,
            images: { ...values.images, [field.key]: next },
          })
        }
        onAdd={(file, onProgress) => onAddImage(field, file, onProgress)}
      />
    );

  if (schema.fields.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("NoFields")}</p>;
  }

  return (
    <div className="space-y-8">
      {loose.length > 0 ? (
        <div className="space-y-4">{loose.map(renderField)}</div>
      ) : null}

      {grouped.map(({ section, fields }) => (
        <section key={section.key} className="space-y-4">
          <h3 className="border-border border-b pb-1 text-sm font-semibold">
            {titleOf(section, locale)}
          </h3>
          {fields.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              {t("EmptySection")}
            </p>
          ) : (
            fields.map(renderField)
          )}
        </section>
      ))}
    </div>
  );
};
