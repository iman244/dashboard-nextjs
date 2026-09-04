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
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";

export function NavUser() {
  const t = useTranslations("/console.ConsoleSidebar");
  const locale = useLocale();
  const isRtl = locale === "fa";
  const { isMobile } = useSidebar();
  const { unauthenticateUser } = useAuth();
  const router = useRouter();

  const { data: user, isPending } = useMe_API();

  const handleLogout = () => {
    // clears tokens, resets the query cache and flips auth status
    unauthenticateUser();
    // the authenticated layout would redirect on its own after a delay;
    // for an explicit logout we send the user straight to sign-in
    router.push(AppRoutes.AUTHENTICATION);
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
