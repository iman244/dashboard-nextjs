"use client";

import { useIsStaff } from "@/data/user/fetches/me";
import React from "react";
import { CONSOLE_NAV_ITEMS, type ConsoleNavItem } from "./items";

/**
 * The console destinations this user should be offered.
 *
 * A hook rather than a filter written at each call site, for the same reason
 * CONSOLE_NAV_ITEMS is one array: the sidebar and the console home must agree,
 * and the copy that drifts is the one nobody on the team uses — the mobile one.
 *
 * `useIsStaff` returns false while `me` is in flight, so a staff-only entry
 * appears on the second render rather than flashing in and out.
 */
export const useConsoleNavItems = (): ConsoleNavItem[] => {
  const isStaff = useIsStaff();
  return React.useMemo(
    () => CONSOLE_NAV_ITEMS.filter((item) => !item.staffOnly || isStaff),
    [isStaff]
  );
};
