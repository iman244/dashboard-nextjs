"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localeDigits } from "@/lib/utils";
import { isMultiple, labelOf, type SchemaField } from "./types";

/**
 * One attached image, however it got there.
 *
 * `url` may be a presigned S3 link (the operator's form) or a blob: URL from
 * the browser (the builder's preview). The component neither knows nor cares.
 */
export type AttachedImage = {
  id: string;
  name: string;
  url?: string;
  /** Carried from the real upload. Django HEADs the object and compares the
   *  size, so guessing here would fail every save. The preview omits them. */
  contentType?: string;
  size?: number;
};

/**
 * Picks images for one `image` field.
 *
 * Uploading is injected, not assumed: the operator's form hands in a function
 * that presigns and PUTs to S3, while the schema builder's preview hands in
 * one that just makes a blob URL. That is why this file has no S3 import --
 * it is the same component in both places, which is the point of the preview.
 */
export const ImageField = ({
  field,
  value,
  onChange,
  onAdd,
  disabled,
}: {
  field: SchemaField;
  value: AttachedImage[];
  onChange: (next: AttachedImage[]) => void;
  onAdd: (file: File, onProgress: (percent: number) => void) => Promise<AttachedImage>;
  disabled?: boolean;
}) => {
  const t = useTranslations("common.SchemaForm");
  const locale = useLocale();
  const [progress, setProgress] = React.useState<Record<string, number>>({});
  const [error, setError] = React.useState<string | null>(null);

  const many = isMultiple(field);
  const limit = field.max_count ?? (many ? undefined : 1);
  const atCapacity = limit !== undefined && value.length >= limit;

  const onPick = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(event.target.files ?? []);
      // Cleared straight away, so choosing the same file twice still fires.
      event.target.value = "";
      if (picked.length === 0) return;
      setError(null);

      let next = value;
      for (const file of picked) {
        if (limit !== undefined && next.length >= limit) {
          setError(t("TooManyImages", { n: localeDigits(limit, locale) }));
          break;
        }
        if (field.max_size_mb && file.size > field.max_size_mb * 1024 * 1024) {
          setError(
            t("ImageTooLarge", {
              name: file.name,
              size: localeDigits(field.max_size_mb, locale),
            })
          );
          continue;
        }
        try {
          const attached = await onAdd(file, (percent) =>
            setProgress((current) => ({ ...current, [file.name]: percent }))
          );
          next = [...next, attached];
          onChange(next);
        } catch {
          setError(t("UploadFailed", { name: file.name }));
        } finally {
          setProgress((current) => {
            const remaining = { ...current };
            delete remaining[file.name];
            return remaining;
          });
        }
      }
    },
    [field.max_size_mb, limit, locale, onAdd, onChange, t, value]
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={field.key}>
        {labelOf(field, locale)}
        {field.required ? (
          <span className="text-destructive ms-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>

      <Input
        id={field.key}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={many}
        disabled={disabled || atCapacity}
        onChange={onPick}
      />

      <p className="text-muted-foreground text-xs">
        {many
          ? t("ManyImages", {
              n: limit ? localeDigits(limit, locale) : t("NoLimit"),
            })
          : t("OneImage")}
        {field.max_size_mb
          ? ` · ${t("MaxSize", {
              size: localeDigits(field.max_size_mb, locale),
            })}`
          : ""}
      </p>

      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {value.map((image) => (
            <li
              key={image.id}
              className="border-border relative h-24 w-24 overflow-hidden rounded-md border"
            >
              {image.url ? (
                <Image
                  src={image.url}
                  alt={image.name}
                  fill
                  sizes="96px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span className="text-muted-foreground flex h-full items-center justify-center p-1 text-center text-[10px]">
                  {image.name}
                </span>
              )}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute end-1 top-1 size-6"
                aria-label={t("RemoveImage", { name: image.name })}
                disabled={disabled}
                onClick={() =>
                  onChange(value.filter((item) => item.id !== image.id))
                }
              >
                <Trash2 className="size-3" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {Object.entries(progress).map(([name, percent]) => (
        <p key={name} className="text-muted-foreground text-xs">
          {name} — {localeDigits(percent, locale)}%
        </p>
      ))}
    </div>
  );
};
