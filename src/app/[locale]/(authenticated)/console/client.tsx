"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/page-header";
import { useConsoleNavItems } from "./_nav/use-console-nav-items";
import { CONSOLE_NAV_GROUPS } from "./_nav/items";

const Client = () => {
  const t = useTranslations("/console.ConsoleHome");
  const tNav = useTranslations("/console.ConsoleSidebar");
  const navItems = useConsoleNavItems().filter((item) => item.group !== "home");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <nav aria-label={t("tasksLabel")} className="max-w-3xl space-y-8">
        {CONSOLE_NAV_GROUPS.filter((group) => group !== "home").map((group) => {
          const items = navItems.filter((item) => item.group === group);
          if (!items.length) return null;
          return (
            <section key={group} aria-labelledby={`console-${group}`}>
              <h2 id={`console-${group}`} className="mb-3 text-base font-semibold">
                {tNav(`groups.${group}`)}
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {items.map((item) => (
                  <li key={item.url}>
                    <Link href={item.url} className="group flex min-h-16 items-center gap-4 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                      <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.primary ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                        <item.icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{tNav(item.titleKey)}</span>
                        <span className="block text-sm text-muted-foreground text-pretty">{t(`descriptions.${item.descriptionKey}`)}</span>
                      </span>
                      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </nav>
    </div>
  );
};

export default Client;
