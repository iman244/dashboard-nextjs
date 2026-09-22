"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck, CircleAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { localeDigits } from "@/lib/utils";
import {
  IMAGE_ACCEPT,
  isMultiple,
  labelOf,
  type SchemaField,
} from "./types";

/**
 * Where one image is in its journey.
 *
 * `pending`   picked, held in the browser, nothing sent yet
 * `uploading` on its way to storage, with a progress figure
 * `done`      in storage; `key` is set
 * `failed`    the upload was refused or never arrived; `error` says why
 */
export type ImageStatus = "pending" | "uploading" | "done" | "failed";

export type AttachedImage = {
  /** Stable client-side handle; survives the upload. */
  id: string;
  name: string;
  /** A blob: preview before upload, a presigned read link after. */
  url?: string;
  /** Held until uploaded, then dropped. */
  file?: File;
  /** The object's key in storage, once it is there. */
  key?: string;
  contentType?: string;
  size?: number;
  status: ImageStatus;
  progress?: number;
  error?: string;
};

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `img-${Math.random().toString(36).slice(2)}`;

/**
 * Picks images for one `image` field. Picking only queues them.
 *
 * Nothing is uploaded here. The form uploads the queue on submit, one image
 * at a time, and this component draws each one's progress and outcome. So
 * the operator can pick, change their mind and remove, all without sending
 * anything -- and the schema builder's preview uses this same component with
 * no upload path at all.
 */
export const ImageField = ({
  field,
  value,
  onChange,
  disabled,
  showErrors,
}: {
  field: SchemaField;
  value: AttachedImage[];
  onChange: (next: AttachedImage[]) => void;
  disabled?: boolean;
  showErrors?: boolean;
}) => {
  const t = useTranslations("common.SchemaForm");
  const locale = useLocale();
  const [pickError, setPickError] = React.useState<string | null>(null);

  const many = isMultiple(field);
  const limit = field.max_count ?? (many ? undefined : 1);
  const atCapacity = limit !== undefined && value.length >= limit;

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    // Cleared straight away, so choosing the same file twice still fires.
    event.target.value = "";
    if (picked.length === 0) return;

    const problems: string[] = [];
    const queued: AttachedImage[] = [];

    for (const file of picked) {
      if (limit !== undefined && value.length + queued.length >= limit) {
        problems.push(t("TooManyImages", { n: localeDigits(limit, locale) }));
        break;
      }
      // Checked here as well as by `accept`: a dragged file or an iPhone HEIC
      // gets past the picker's filter, and would otherwise fail only at the
      // server, after everything else had been filled in.
      if (!(IMAGE_ACCEPT as readonly string[]).includes(file.type)) {
        problems.push(t("NotAnImage", { name: file.name }));
        continue;
      }
      if (field.max_size_mb && file.size > field.max_size_mb * 1024 * 1024) {
        problems.push(
          t("ImageTooLarge", {
            name: file.name,
            size: localeDigits(field.max_size_mb, locale),
          })
        );
        continue;
      }
      queued.push({
        id: newId(),
        name: file.name,
        url: URL.createObjectURL(file),
        file,
        contentType: file.type,
        size: file.size,
        status: "pending",
      });
    }

    setPickError(problems.length > 0 ? problems.join(" ") : null);
    if (queued.length > 0) onChange([...value, ...queued]);
  };

  const remove = (image: AttachedImage) => {
    if (image.url?.startsWith("blob:")) URL.revokeObjectURL(image.url);
    onChange(value.filter((item) => item.id !== image.id));
  };

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
        accept={IMAGE_ACCEPT.join(",")}
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

      {pickError ? (
        <p className="text-destructive text-xs" role="alert">
          {pickError}
        </p>
      ) : showErrors && field.required && value.length === 0 ? (
        <p className="text-destructive text-xs" role="alert">
          {t("Required")}
        </p>
      ) : null}

      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((image) => (
            <ImageRow
              key={image.id}
              image={image}
              disabled={disabled}
              onRemove={() => remove(image)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
};

/** One queued or stored image: thumbnail, name, and where it has got to. */
const ImageRow = ({
  image,
  disabled,
  onRemove,
}: {
  image: AttachedImage;
  disabled?: boolean;
  onRemove: () => void;
}) => {
  const t = useTranslations("common.SchemaForm");
  const locale = useLocale();
  const percent = image.status === "done" ? 100 : (image.progress ?? 0);

  return (
    <li className="border-border flex items-center gap-3 rounded-md border p-2">
      <div className="bg-muted relative size-12 shrink-0 overflow-hidden rounded">
        {image.url ? (
          <Image
            src={image.url}
            alt=""
            fill
            sizes="48px"
            unoptimized
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm" dir="ltr" title={image.name}>
          {image.name}
        </p>

        {image.status === "uploading" || image.status === "done" ? (
          <div
            className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-label={image.name}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            {/* inline-size, not width: in RTL it fills from the right. */}
            <div
              className={
                image.status === "done"
                  ? "h-full bg-green-600 transition-[inline-size]"
                  : "bg-primary h-full transition-[inline-size]"
              }
              style={{ inlineSize: `${percent}%` }}
            />
          </div>
        ) : null}

        <p
          className={
            image.status === "failed"
              ? "text-destructive flex items-center gap-1 text-xs"
              : image.status === "done"
                ? "flex items-center gap-1 text-xs text-green-700 dark:text-green-500"
                : "text-muted-foreground text-xs"
          }
          role={image.status === "failed" ? "alert" : undefined}
        >
          {image.status === "failed" ? (
            <>
              <CircleAlert className="size-3 shrink-0" aria-hidden="true" />
              {image.error ?? t("UploadFailedShort")}
            </>
          ) : image.status === "done" ? (
            <>
              <CircleCheck className="size-3 shrink-0" aria-hidden="true" />
              {t("Uploaded")}
            </>
          ) : image.status === "uploading" ? (
            t("Uploading", { percent: localeDigits(percent, locale) })
          ) : (
            t("Queued")
          )}
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("RemoveImage", { name: image.name })}
        disabled={disabled || image.status === "uploading"}
        onClick={onRemove}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </li>
  );
};
