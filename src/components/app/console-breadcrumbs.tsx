"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/** Ancestor links for a console page; the PageHeader title names the current page. */
export function ConsoleBreadcrumbs({
  parent,
}: {
  parent?: { href: string; label: string };
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
        {parent && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={parent.href}>{parent.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
