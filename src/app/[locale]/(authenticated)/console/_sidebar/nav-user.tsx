"use client";

import React from "react";

import {
  ChevronsUpDown,
  Languages,
  LogOut,
  Palette,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useIsRtl } from "@/lib/use-direction";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/app/_auth";
import { useMe_API } from "@/data/user/fetches/me";
import {
  LanguageMenuItems,
  localeName,
} from "@/components/app/language-switcher";
import { ThemeMenuItems, useThemeLabel } from "@/components/app/theme-toggle";

/**
 * One preference in the account menu: what it is, what it is currently set to,
 * and the choices behind it.
 *
 * The value column is why these are menu rows at all — a bare toggle button
 * can show a language name but cannot say whether that name is the current
 * state or the destination.
 */
const PreferenceRow = ({
  icon: Icon,
  label,
  value,
  valueLang,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Set when the value is written in its own script rather than the UI's. */
  valueLang?: string;
  children: React.ReactNode;
}) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger>
      <Icon aria-hidden="true" />
      {/* `flex-1` on the label rather than `ms-auto` on the value.
          DropdownMenuSubTrigger already gives its chevron `ms-auto`, and two
          auto margins do not stack — flexbox splits the free space between
          them. That parked the value in the middle of the row at a position
          set by the label's length, so the two rows disagreed by 9px and would
          drift further as labels changed. Letting the label absorb the slack
          leaves the chevron's margin with nothing to take, and pins every
          value to one column. */}
      <span className="flex-1">{label}</span>
      {/* No `text-xs`: at 12px on a 14px row the two sat on different
          baselines. One type size per row; the muted token carries the
          hierarchy on its own. */}
      <span className="text-muted-foreground" lang={valueLang}>
        {value}
      </span>
    </DropdownMenuSubTrigger>
    <DropdownMenuPortal>
      <DropdownMenuSubContent>{children}</DropdownMenuSubContent>
    </DropdownMenuPortal>
  </DropdownMenuSub>
);

export function NavUser() {
  const t = useTranslations("/console.ConsoleSidebar");
  const tLanguage = useTranslations("common.Language");
  const tTheme = useTranslations("common.Theme");
  const locale = useLocale();
  const themeLabel = useThemeLabel();
  const isRtl = useIsRtl();
  const { isMobile } = useSidebar();
  const { unauthenticateUser } = useAuth();

  const { data: user, isPending } = useMe_API();

  const handleLogout = () => {
    // Clears tokens, resets the query cache and flips auth status. That flip is
    // all this needs to do: the authenticated layout redirects on the same tick.
    // It used to also push to sign-in, because that layout sat on a 3s timer —
    // now that the timer is gone, two navigations would race for the same
    // moment. The layout is the single owner.
    unauthenticateUser();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <UserIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                {isPending ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="truncate font-medium">
                    {user?.username ?? t("account")}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ms-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : isRtl ? "left" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-2 text-start text-sm">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <UserIcon className="size-4" />
                </div>
                <span className="truncate font-medium">
                  {user?.username ?? t("account")}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Preferences, between the identity above and the way out below.
                Each row names the setting and reports what it is currently on,
                so the menu answers "which language am I in" without being
                opened twice — something the bare toggle in the sidebar footer
                could never do, which is why it moved here. */}
            <PreferenceRow
              icon={Languages}
              label={tLanguage("label")}
              value={localeName(locale)}
              valueLang={locale}
            >
              <LanguageMenuItems />
            </PreferenceRow>
            <PreferenceRow
              icon={Palette}
              label={tTheme("label")}
              value={themeLabel}
            >
              <ThemeMenuItems />
            </PreferenceRow>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="rtl:-scale-x-100" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
