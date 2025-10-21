"use client";

import { BarChart, FileText, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function AppSidebar() {
  const pathname = usePathname();

  const t = useTranslations("ConsoleSidebar");
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
    </Sidebar>
  );
}
