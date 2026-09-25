"use client";

import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type PersonnelListItem = {
  key: string;
  name: string;
  /** Already in the locale's digits. */
  nationalId: string;
  /** The person's page; null when the row has no national ID to key it on. */
  href: string | null;
};

/**
 * The personnel sheet's rows on a phone.
 *
 * The table's four columns -- first name, last name, national ID and a
 * labelled action -- do not fit a phone's width, so there each person is one
 * row you tap: full name over national ID, with a chevron for "opens". It is
 * fed the table's current page, so search, the chart's filter and pagination
 * behave exactly as they do in the table.
 */
export const PersonnelList = ({
  items,
  openLabel,
  emptyMessage,
  onNavigate,
}: {
  items: PersonnelListItem[];
  openLabel: string;
  emptyMessage: string;
  onNavigate: () => void;
}) => {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border py-8 text-center text-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {items.map((item) => {
        const body = (
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{item.name}</p>
            <p className="text-muted-foreground text-sm tabular-nums">
              {item.nationalId}
            </p>
          </div>
        );

        return (
          <li key={item.key}>
            {item.href ? (
              <Link
                href={item.href}
                onClick={onNavigate}
                className="active:bg-muted/60 focus-visible:ring-ring flex min-h-14 items-center gap-3 px-3 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset"
              >
                {body}
                <span className="sr-only">{openLabel}</span>
                {/* "Forward" points the way the text reads. */}
                <ChevronLeft
                  aria-hidden="true"
                  className="text-muted-foreground size-4 shrink-0 ltr:rotate-180"
                />
              </Link>
            ) : (
              <div className="flex min-h-14 items-center gap-3 px-3 py-2">
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
