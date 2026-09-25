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
import { useConsoleNavItems } from "../_nav/use-console-nav-items";
import { CONSOLE_NAV_GROUPS, isConsoleNavItemActive } from "../_nav/items";

export function AppSidebar() {
  const pathname = usePathname();
  const navItems = useConsoleNavItems();
  const t = useTranslations("/console.ConsoleSidebar");
  const side = useIsRtl() ? "right" : "left";
  const dir = useDirection();

  return (
    <Sidebar side={side}>
      <SidebarContent dir={dir}>
        {CONSOLE_NAV_GROUPS.map((group) => {
          const items = navItems.filter((item) => item.group === group);
          if (!items.length) return null;
          return (
            <SidebarGroup key={group}>
              {group !== "home" && <SidebarGroupLabel>{t(`groups.${group}`)}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const active = isConsoleNavItemActive(item, pathname);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link href={item.url} aria-current={active ? "page" : undefined}>
                            <item.icon />
                            <span>{t(item.titleKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter dir={dir}><NavUser /></SidebarFooter>
    </Sidebar>
  );
}
