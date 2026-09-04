"use client";

import { BarChart, FileText, SquareActivity, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { NavUser } from "./nav-user";
import { DarkModeToggle } from "@/components/app/theme-toggle";

export function AppSidebar() {
  const pathname = usePathname();

  const t = useTranslations("/console.ConsoleSidebar");
  const tTheme = useTranslations("common.Theme");
  const locale = useLocale();
  const side = locale === "fa" ? "right" : "left";
  const dir = locale === "fa" ? "rtl" : "ltr";

  const items = [
    {
      title: t("electronicHealthRecord"),
      url: "/console/electronic-health-record",
      icon: FileText,
    },
    {
      title: t("periodicalReports"),
      url: "/console/periodical-reports",
      icon: BarChart,
    },
    {
      title: t("patientReports"),
      url: "/console/patient-reports",
      icon: User,
    },
    {
      title: t("saderatBankHealthMonitoring"),
      url: "/console/saderat-bank-health-monitoring",
      icon: SquareActivity,
    },
    {
      title: t("formSabtPayesh"),
      url: "/form-sabt-payesh",
      icon: SquareActivity,
    },
  ];

  return (
    <Sidebar side={side}>
      <SidebarContent dir={dir}>
        <SidebarGroup>
          <SidebarGroupLabel>{t("dashboard")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter dir={dir}>
        {/* Hidden when the sidebar collapses to icons — the trigger is a fixed
            36px control and would overflow the rail. */}
        <div className="flex items-center justify-between gap-2 px-1 group-data-[collapsible=icon]:hidden">
          <span className="text-xs text-muted-foreground">{tTheme("label")}</span>
          <DarkModeToggle />
        </div>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
