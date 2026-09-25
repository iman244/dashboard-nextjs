"use client";

import * as React from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ExternalLink,
  ImageOff,
  Pencil,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  DIGIT_STRING,
  IMAGE,
  asFieldSchema,
  groupFields,
  labelOf,
  titleOf,
  toDigits,
  type SchemaField,
} from "@/components/schema-form/types";
import { useList_PatientRecord_API } from "@/data/patient-entry/api/records";
import { useIsStaff } from "@/data/user/fetches/me";
import type {
  PatientEntryFile,
  PatientRecord,
} from "@/data/patient-entry/types";
import { formatDate, localeDigits } from "@/lib/utils";
import { useDirection } from "@/lib/use-direction";

type Viewing = { files: PatientEntryFile[]; index: number; title: string };

/**
 * The ten-digit form of a national ID as a page happens to hold it.
 *
 * Iranian national IDs are always ten digits, but a spreadsheet column read
 * as a number drops the leading zeros -- step 2's Excel turns 0849290351 into
 * 849290351 -- so eight or nine digits can only mean zeros were lost.
 */
const fullNationalId = (raw: string | null | undefined) => {
  const digits = toDigits(raw ?? "");
  return digits.length >= 8 && digits.length < 10
    ? digits.padStart(10, "0")
    : digits;
};

/**
 * What operators recorded for one patient through the monitoring forms: the
 * digit fields and the images, one block per monitoring.
 *
 * Shared by the staff patient pages and the patient portal. `authorized`
 * decides whether the staff token is sent -- see PatientRecordsInput.
 */
export const PatientRecordsSection = ({
  nationalId,
  authorized,
}: {
  nationalId: string | null | undefined;
  authorized: boolean;
}) => {
  const t = useTranslations("common.PatientRecordsSection");
  const id = fullNationalId(nationalId);
  const valid = id.length === 10;
  const records = useList_PatientRecord_API({ nationalId: id, authorized });
  const [viewing, setViewing] = React.useState<Viewing | null>(null);

  if (!valid) return null;

  const shown = (records.data ?? []).filter(hasContent);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Title")}</CardTitle>
        <CardDescription>{t("Description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {records.isPending ? (
          <div className="flex flex-wrap gap-3" aria-busy="true">
            <span className="sr-only">{t("Loading")}</span>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="size-24 rounded-lg" />
            ))}
          </div>
        ) : records.isError ? (
          <p className="text-sm text-destructive">{t("LoadFailed")}</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Empty")}</p>
        ) : (
          shown.map((record) => (
            <RecordBlock
              key={record.id}
              record={record}
              editable={authorized}
              onOpen={setViewing}
            />
          ))
        )}
      </CardContent>

      <Viewer viewing={viewing} onClose={() => setViewing(null)} />
    </Card>
  );
};

const valueOf = (record: PatientRecord, key: string) => {
  const value = (record.values as Record<string, unknown> | null)?.[key];
  return typeof value === "string" ? value : "";
};

const filesOf = (record: PatientRecord, key: string) =>
  record.files.filter((file) => file.field_key === key);

const fieldHasContent = (record: PatientRecord, field: SchemaField) =>
  field.type === IMAGE
    ? filesOf(record, field.key).length > 0
    : valueOf(record, field.key) !== "";

/** A record whose every field is empty says nothing worth a block. */
const hasContent = (record: PatientRecord) =>
  record.files.length > 0 ||
  asFieldSchema(record.monitoring.field_schema).fields.some((field) =>
    fieldHasContent(record, field)
  );

const RecordBlock = ({
  record,
  editable,
  onOpen,
}: {
  record: PatientRecord;
  editable: boolean;
  onOpen: (viewing: Viewing) => void;
}) => {
  const t = useTranslations("common.PatientRecordsSection");
  const locale = useLocale();
  const schema = asFieldSchema(record.monitoring.field_schema);
  const { loose, grouped } = groupFields(schema);
  const name =
    locale === "fa" ? record.monitoring.name_fa : record.monitoring.name_en;

  const groups = [
    { key: "_loose", title: null as string | null, fields: loose },
    ...grouped.map(({ section, fields }) => ({
      key: section.key,
      title: titleOf(section, locale),
      fields,
    })),
  ]
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => fieldHasContent(record, field)),
    }))
    .filter((group) => group.fields.length > 0);

  return (
    <section className="space-y-4 border-t pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {t("UpdatedAt", {
              date: localeDigits(
                formatDate(new Date(record.updated_at), locale),
                locale
              ),
            })}
          </p>
        </div>
        {/* Mounted only on staff pages: the portal has no Django session, so
            asking who the user is there would only fail. */}
        {editable ? <EditLink record={record} /> : null}
      </div>

      {groups.map((group) => (
        <div key={group.key} className="space-y-3">
          {group.title ? (
            <h4 className="text-sm font-medium text-muted-foreground">
              {group.title}
            </h4>
          ) : null}

          {/* Values first, as one compact grid; images after, each field its
              own row, because a strip of thumbnails needs the full width. */}
          {group.fields.some((field) => field.type === DIGIT_STRING) ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
              {group.fields
                .filter((field) => field.type === DIGIT_STRING)
                .map((field) => (
                  <div key={field.key}>
                    <dt className="text-muted-foreground">
                      {labelOf(field, locale)}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {localeDigits(valueOf(record, field.key), locale)}
                    </dd>
                  </div>
                ))}
            </dl>
          ) : null}

          {group.fields
            .filter((field) => field.type === IMAGE)
            .map((field) => {
              const files = filesOf(record, field.key);
              const viewable = files.filter((file) => file.url);
              const title = labelOf(field, locale);
              return (
                <div key={field.key} className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {title}{" "}
                    <span className="tabular-nums">
                      ({localeDigits(files.length, locale)})
                    </span>
                  </p>
                  <ul className="flex flex-wrap gap-3">
                    {files.map((file) => (
                      <li key={file.id}>
                        <Thumbnail
                          file={file}
                          onOpen={() =>
                            onOpen({
                              files: viewable,
                              index: viewable.indexOf(file),
                              title,
                            })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      ))}
    </section>
  );
};

/** Editing is staff-only, as Django enforces; others see no link. */
const EditLink = ({ record }: { record: PatientRecord }) => {
  const t = useTranslations("common.PatientRecordsSection");
  const isStaff = useIsStaff();
  if (!isStaff) return null;
  return (
    <Button asChild variant="ghost" size="sm">
      <Link
        href={`/console/monitorings/${record.monitoring.id}/records/${record.id}/edit`}
      >
        <Pencil className="size-4" />
        {t("Edit")}
      </Link>
    </Button>
  );
};

const Thumbnail = ({
  file,
  onOpen,
}: {
  file: PatientEntryFile;
  onOpen: () => void;
}) => {
  const t = useTranslations("common.PatientRecordsSection");

  // No URL means storage could not be reached when the page asked; the file
  // still exists, so say that rather than hide it.
  if (!file.url) {
    return (
      <div
        className="bg-muted text-muted-foreground flex size-24 flex-col items-center justify-center gap-1 rounded-lg p-2 text-center text-[11px]"
        title={file.original_name}
      >
        <ImageOff className="size-5" aria-hidden="true" />
        {t("Unavailable")}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      title={file.original_name}
      aria-label={t("OpenImage", { name: file.original_name })}
      className="bg-muted focus-visible:ring-ring relative block size-24 overflow-hidden rounded-lg outline-none transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]"
    >
      <Image
        src={file.url}
        alt=""
        fill
        sizes="96px"
        unoptimized
        loading="lazy"
        className="object-cover"
      />
    </button>
  );
};

/**
 * The field's images as a carousel, opened on the one that was clicked.
 *
 * Swipe, the arrow buttons, or the arrow keys (which follow the reading
 * direction) move between them. The body is keyed per opening so the
 * carousel starts fresh at the clicked image each time.
 */
const Viewer = ({
  viewing,
  onClose,
}: {
  viewing: Viewing | null;
  onClose: () => void;
}) => (
  <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="sm:max-w-3xl">
      {viewing ? (
        <ViewerBody
          key={`${viewing.files[0]?.id}-${viewing.index}`}
          viewing={viewing}
        />
      ) : null}
    </DialogContent>
  </Dialog>
);

const ViewerBody = ({ viewing }: { viewing: Viewing }) => {
  const t = useTranslations("common.PatientRecordsSection");
  const locale = useLocale();
  const direction = useDirection();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(viewing.index);
  const count = viewing.files.length;
  const file = viewing.files[current];

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <>
      <DialogTitle className="truncate pe-8">{viewing.title}</DialogTitle>
      <DialogDescription className="truncate">
        {/* Only the name is isolated: it is usually Latin, and letting it set
            the direction of the whole line scrambled "2 of 3" in Persian. */}
        <bdi>{file?.original_name}</bdi>
        {count > 1
          ? ` — ${t("Position", {
              index: localeDigits(current + 1, locale),
              count: localeDigits(count, locale),
            })}`
          : ""}
      </DialogDescription>

      <Carousel
        dir={direction}
        opts={{ direction, startIndex: viewing.index, loop: count > 1 }}
        setApi={setApi}
        // Focusable, and first in the dialog, so it receives focus on open
        // and the arrow keys work straight away.
        tabIndex={0}
        aria-label={viewing.title}
        className="focus-visible:ring-ring rounded-lg outline-none focus-visible:ring-2"
      >
        <CarouselContent>
          {viewing.files.map((image, index) => (
            <CarouselItem key={image.id}>
              <div className="bg-muted relative h-[65dvh] w-full overflow-hidden rounded-lg">
                {image.url ? (
                  <Image
                    src={image.url}
                    alt={image.original_name}
                    fill
                    sizes="(min-width: 640px) 768px, 100vw"
                    unoptimized
                    // The opening image first; its neighbours as they come.
                    loading={index === viewing.index ? "eager" : "lazy"}
                    className="object-contain"
                  />
                ) : null}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {count > 1 ? (
          <>
            <CarouselPrevious
              label={t("Previous")}
              className="start-3 bg-background/80 backdrop-blur-sm"
            />
            <CarouselNext
              label={t("Next")}
              className="end-3 bg-background/80 backdrop-blur-sm"
            />
          </>
        ) : null}
      </Carousel>

      {file?.url ? (
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              {t("OpenOriginal")}
            </a>
          </Button>
        </div>
      ) : null}
    </>
  );
};
