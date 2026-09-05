"use client";

import { ChevronsUpDown, LogOut, User as UserIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

export function NavUser() {
  const t = useTranslations("/console.ConsoleSidebar");
  const locale = useLocale();
  const isRtl = locale === "fa";
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
