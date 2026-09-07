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

export function AppSidebar() {
  const pathname = usePathname();

  const t = useTranslations("/console.ConsoleSidebar");
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
      {/* Language and appearance used to sit here as a labelled pair. They
          live in the account menu now: a signed-in user looks for their own
          preferences under their own name, and a menu row can report which
          language and theme are currently active — a bare toggle button cannot
          say whether its label is the current state or the destination. The
          footer also stops competing with the nav for vertical space. */}
      <SidebarFooter dir={dir}>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
