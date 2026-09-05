"use client";

import React from "react";
import { ChartTooltipContent } from "@/components/ui/chart";
import { useLocaleDigits } from "@/lib/use-locale-digits";

/**
 * Tooltip that renders counts in the reader's own digits.
 *
 * Declared at module scope on purpose. The step-1 page defines its equivalent
 * inside the page component, which makes React treat it as a new component
 * type on every render and remount the whole chart subtree — the cause of its
 * 25 react-hooks/static-components errors.
 */
export const LocaleChartTooltip = (
  props: React.ComponentProps<typeof ChartTooltipContent>
) => {
  const fmt = useLocaleDigits();
  return <ChartTooltipContent {...props} formatter={fmt} />;
};
