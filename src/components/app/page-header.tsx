import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The console's page header.
 *
 * Every route used to render its own heading — one `h1`, three `h2`s, one route
 * with none at all — because `console/layout.tsx` provided no slot for a title.
 * Routing every page through this keeps the heading level, type scale and action
 * placement consistent, and gives actions a defined home.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Primary and secondary actions for this page, e.g. filters or export. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-[-0.01em]">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
