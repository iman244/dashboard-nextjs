"use client";

import { useTranslations } from "next-intl";
import { Hash, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIGIT_STRING, IMAGE, type FieldSchema } from "@/components/schema-form";
import { FieldEditor } from "./field-editor";
import {
  addField,
  addSection,
  moveField,
  removeField,
  removeSection,
  updateField,
  updateSection,
} from "./draft";

/**
 * The editing half of the builder: sections, fields, and their settings.
 *
 * Holds no state of its own -- the page owns the draft, so the preview beside
 * it always renders the same object this pane just edited.
 */
export const SchemaBuilder = ({
  schema,
  onChange,
}: {
  schema: FieldSchema;
  onChange: (next: FieldSchema) => void;
}) => {
  const t = useTranslations("/console/monitorings.Builder");
  const sections = schema.sections ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(addField(schema, DIGIT_STRING))}
        >
          <Hash className="size-4" aria-hidden="true" />
          {t("AddDigitString")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(addField(schema, IMAGE))}
        >
          <ImageIcon className="size-4" aria-hidden="true" />
          {t("AddImage")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(addSection(schema))}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("AddSection")}
        </Button>
      </div>

      {sections.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t("Sections")}</h3>
          {sections.map((section) => (
            <div
              key={section.key}
              className="border-border flex flex-wrap items-end gap-3 rounded-md border p-3"
            >
              <div className="min-w-40 flex-1 space-y-1">
                <Label htmlFor={`${section.key}-title-fa`}>
                  {t("SectionTitleFa")}
                </Label>
                <Input
                  id={`${section.key}-title-fa`}
                  value={section.title_fa}
                  onChange={(event) =>
                    onChange(
                      updateSection(schema, section.key, {
                        title_fa: event.target.value,
                      })
                    )
                  }
                />
              </div>
              <div className="min-w-40 flex-1 space-y-1">
                <Label htmlFor={`${section.key}-title-en`}>
                  {t("SectionTitleEn")}
                </Label>
                <Input
                  id={`${section.key}-title-en`}
                  dir="ltr"
                  value={section.title_en}
                  onChange={(event) =>
                    onChange(
                      updateSection(schema, section.key, {
                        title_en: event.target.value,
                      })
                    )
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("RemoveSection")}
                onClick={() => onChange(removeSection(schema, section.key))}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
          <p className="text-muted-foreground text-xs">
            {t("RemoveSectionKeepsFields")}
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{t("Fields")}</h3>
        {schema.fields.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("NoFieldsYet")}</p>
        ) : (
          schema.fields.map((field) => (
            <FieldEditor
              // `_id`, not `key`: the key is editable, and keying on it
              // would remount this row on every keystroke.
              key={field._id}
              field={field}
              schema={schema}
              onChange={(patch) =>
                onChange(updateField(schema, field._id ?? "", patch))
              }
              onRemove={() => onChange(removeField(schema, field._id ?? ""))}
              onMove={(delta) =>
                onChange(moveField(schema, field._id ?? "", delta))
              }
            />
          ))
        )}
      </div>
    </div>
  );
};
