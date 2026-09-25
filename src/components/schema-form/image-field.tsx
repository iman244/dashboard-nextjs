"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Check, CircleAlert, CloudUpload, X } from "lucide-react";
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
        <ul className="flex flex-wrap gap-3">
          {value.map((image) => (
            <ImageTile
              key={image.id}
              image={image}
              disabled={disabled}
              onRemove={() => remove(image)}
            />
          ))}
        </ul>
      ) : null}

      {/* Why each failure failed, in words. The tile only has room for an
          icon, and "failed" alone gives the operator nothing to act on. */}
      {value.some((image) => image.status === "failed") ? (
        <ul className="text-destructive space-y-1 text-xs" role="alert">
          {value
            .filter((image) => image.status === "failed")
            .map((image) => (
              <li key={image.id}>
                <span dir="ltr">{image.name}</span>
                {": "}
                {image.error ?? t("UploadFailedShort")}
              </li>
            ))}
        </ul>
      ) : null}
    </div>
  );
};

/** Ring geometry, in the SVG's own 40x40 coordinate space. */
const RING_RADIUS = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * A circular progress indicator drawn over the photo.
 *
 * The fill is `stroke-dashoffset`, eased linearly over 150ms between updates.
 * Upload progress arrives in bursts; without the short transition the ring
 * would jump in visible steps. Linear, because this is progress, not a
 * gesture -- an ease curve would make it appear to hesitate at each update.
 *
 * It fills clockwise from the top in both directions. Like a clock face,
 * circular progress is not mirrored for RTL.
 */
const ProgressRing = ({
  percent,
  label,
}: {
  percent: number;
  label: string;
}) => (
  <svg
    viewBox="0 0 40 40"
    className="size-11 -rotate-90"
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={percent}
  >
    <circle
      cx="20"
      cy="20"
      r={RING_RADIUS}
      fill="none"
      strokeWidth="3.5"
      className="stroke-white/30"
    />
    <circle
      cx="20"
      cy="20"
      r={RING_RADIUS}
      fill="none"
      strokeWidth="3.5"
      strokeLinecap="round"
      className="stroke-white transition-[stroke-dashoffset] duration-150 ease-linear motion-reduce:transition-none"
      strokeDasharray={RING_CIRCUMFERENCE}
      strokeDashoffset={RING_CIRCUMFERENCE * (1 - percent / 100)}
    />
  </svg>
);

/**
 * One image as a square tile: the photo itself, with its state drawn on it.
 *
 * queued    photo under a light scrim, an upload glyph in an empty ring
 * uploading darker scrim, the ring filling, the percentage at its centre
 * done      scrim fades away, a check badge settles into the corner
 * failed    red-tinted scrim and an alert glyph; the reason is listed below
 *
 * The scrim is what makes the ring legible on any photo -- white on an
 * X-ray and white on a bright scan need the same dark ground beneath them.
 */
const ImageTile = ({
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

  const statusText =
    image.status === "failed"
      ? (image.error ?? t("UploadFailedShort"))
      : image.status === "done"
        ? t("Uploaded")
        : image.status === "uploading"
          ? t("Uploading", { percent: localeDigits(percent, locale) })
          : t("Queued");

  // Strong ease-out: the state change should be felt immediately, then settle.
  const settle =
    "duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-opacity";

  return (
    <li className="w-24 space-y-1">
      <div
        className="bg-muted relative size-24 overflow-hidden rounded-lg"
        title={`${image.name} — ${statusText}`}
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
        ) : null}

        {/* Scrim. Always mounted, so leaving a state fades rather than cuts. */}
        <div
          aria-hidden="true"
          className={[
            "absolute inset-0 transition-[opacity,background-color]",
            settle,
            image.status === "done"
              ? "bg-black/0 opacity-0"
              : image.status === "failed"
                ? "bg-red-900/60 opacity-100"
                : image.status === "uploading"
                  ? "bg-black/55 opacity-100"
                  : "bg-black/35 opacity-100",
          ].join(" ")}
        />

        {/* Centre: ring while it matters, alert glyph on failure. */}
        {image.status === "pending" || image.status === "uploading" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <ProgressRing percent={percent} label={image.name} />
            <span className="absolute text-[11px] font-semibold text-white tabular-nums">
              {image.status === "uploading" ? (
                localeDigits(percent, locale)
              ) : (
                <CloudUpload className="size-4" aria-hidden="true" />
              )}
            </span>
          </div>
        ) : image.status === "failed" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <CircleAlert className="size-7 text-white" aria-hidden="true" />
          </div>
        ) : null}

        {/* Done: a check that scales in from 0.9, never from nothing. */}
        <span
          aria-hidden="true"
          className={[
            "absolute bottom-1 end-1 flex size-5 items-center justify-center rounded-full bg-green-600 text-white shadow transition-[opacity,transform]",
            settle,
            image.status === "done"
              ? "scale-100 opacity-100"
              : "scale-90 opacity-0",
          ].join(" ")}
        >
          <Check className="size-3" strokeWidth={3} />
        </span>

        {image.status !== "uploading" ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="bg-background/85 absolute end-1 top-1 size-6 rounded-full backdrop-blur-sm transition-transform duration-150 ease-out active:scale-95"
            aria-label={t("RemoveImage", { name: image.name })}
            disabled={disabled}
            onClick={onRemove}
          >
            <X className="size-3.5" aria-hidden="true" />
          </Button>
        ) : null}

        <span className="sr-only" aria-live="polite">
          {statusText}
        </span>
      </div>

      <p
        className="text-muted-foreground truncate text-[11px]"
        dir="ltr"
        title={image.name}
      >
        {image.name}
      </p>
    </li>
  );
};
