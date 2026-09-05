import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The console's page header.
 *
 * Every route used to render its own heading — one `h1`, three `h2`s, one route
 * with none at all — because `console/layout.tsx` provided no slot for a title.
 * Routing every page through this keeps the heading level, type scale and action
 * placement consistent.
 *
 * Checked against ui-ux-pro-max's ux-guidelines.csv:
 *   #39 Heading Hierarchy — exactly one `h1` per page, levels not skipped.
 *   #6  Breadcrumbs — warranted at 3+ levels of depth; the console reaches four
 *       (/console/saderat-bank-health-monitoring/[id]/[national_id]), so the
 *       trail is a first-class slot rather than an afterthought.
 *   #74 Font Size Scale — Tailwind's modular steps only, no arbitrary px.
 *   #77 Heading Clarity — text-2xl/semibold against text-sm body is a clear step.
 *   #110 Heading Line Balance — bounded measure plus balanced wrap, no <br>.
 */
export function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
  className,
}: {
  /** Ancestor trail, nearest-last. The current page is the `title`, not a crumb. */
  breadcrumbs?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Page-level actions, e.g. filters or export. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border pb-5", className)}>
      {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="max-w-[40ch] text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {description && (
            <p className="max-w-[65ch] text-sm text-muted-foreground text-pretty">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
