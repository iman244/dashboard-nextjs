"use client";

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
import { useTranslations } from "next-intl";
import { useDirection, useIsRtl } from "@/lib/use-direction";
import { Link, usePathname } from "@/i18n/navigation";
import { NavUser } from "./nav-user";
import { CONSOLE_NAV_ITEMS } from "../_nav/items";
import { DarkModeToggle } from "@/components/app/theme-toggle";

export function AppSidebar() {
  const pathname = usePathname();

  const t = useTranslations("/console.ConsoleSidebar");
  const tTheme = useTranslations("common.Theme");
  const isRtl = useIsRtl();
  // The sidebar sits on the reading-start edge.
  const side = isRtl ? "right" : "left";
  const dir = useDirection();


  return (
    <Sidebar side={side}>
      <SidebarContent dir={dir}>
        <SidebarGroup>
          <SidebarGroupLabel>{t("dashboard")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CONSOLE_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{t(item.titleKey)}</span>
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
