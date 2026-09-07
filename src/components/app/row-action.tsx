"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/**
 * One control in a table's actions column.
 *
 * The label is rendered, not hidden in `aria-label`. These columns were
 * icon-only, which meant the only way to learn what a row's buttons did was to
 * click one: four grey document glyphs — file, eye, clipboard, chart — do not
 * distinguish themselves at a glance, and the names existed solely for screen
 * readers. Showing the text names the action for everyone and lets the icon do
 * what it is good at, which is being found again quickly.
 *
 * The icon is `aria-hidden`, so the visible text is the accessible name and
 * nothing is announced twice.
 */
type RowActionProps = {
  icon: LucideIcon;
  label: string;
} & (
  | { href: string; onClick?: () => void; disabled?: never }
  | { href?: never; onClick: () => void; disabled?: boolean }
);

export const RowAction = ({
  icon: Icon,
  label,
  href,
  onClick,
  disabled,
}: RowActionProps) => {
  const content = (
    <>
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </>
  );

  if (href) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href={href} onClick={onClick}>
          {content}
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={disabled}>
      {content}
    </Button>
  );
};

/** The cell that holds them, so spacing matches across every table. */
export const RowActions = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-1">{children}</div>
);
