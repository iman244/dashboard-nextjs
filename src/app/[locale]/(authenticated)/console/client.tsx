"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/page-header";
import { CONSOLE_NAV_ITEMS } from "./_nav/items";

/**
 * The console front door.
 *
 * This route rendered an empty `<div>`. On desktop that was merely a poor first
 * impression — the sidebar was still there. On a phone the sidebar is behind a
 * trigger, so signing in landed the user on a genuinely blank screen with no
 * visible way forward.
 *
 * A list, not a grid of cards: five destinations do not need three columns, and
 * a full-width row is a better target on a phone than a third of one. The rows
 * are the same on both, so there is no layout to re-learn between devices.
 */
const Client = () => {
  const t = useTranslations("/console.ConsoleHome");
  const tNav = useTranslations("/console.ConsoleSidebar");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <nav aria-label={t("title")} className="max-w-3xl">
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {CONSOLE_NAV_ITEMS.map((item) => (
            <li key={item.url}>
              <Link
                href={item.url}
                // min-h-16 keeps every row past the 44px touch minimum, and the
                // whole row is the target rather than the title alone.
                className="group flex min-h-16 items-center gap-4 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                >
                  <item.icon className="size-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {tNav(item.titleKey)}
                  </span>
                  <span className="block text-sm text-muted-foreground text-pretty">
                    {t(`descriptions.${item.descriptionKey}`)}
                  </span>
                </span>

                {/* Points along the reading direction: this is "onward", not
                    "back", so it mirrors the same way the breadcrumb does. */}
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Client;
