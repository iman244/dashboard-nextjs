"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Crumb = { href: string; label: string };

/**
 * Ancestor links for a console page; the PageHeader title names the current page.
 * `trail` is for pages two levels deep, nearest-last; `parent` is the one-level shorthand.
 */
export function ConsoleBreadcrumbs({
  parent,
  trail = parent ? [parent] : [],
}: {
  parent?: Crumb;
  trail?: Crumb[];
}) {
  const tHome = useTranslations("/console.ConsoleHome");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/console">{tHome("title")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {trail.map((crumb) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={crumb.href}>{crumb.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
