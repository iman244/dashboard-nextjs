import React from "react";
import { ArrowDown, ArrowUp, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EhrStatus } from "./classify";

/**
 * Status is carried by icon *and* colour, never colour alone: the arrows read
 * on their own for a reader who cannot separate the hues, and in print.
 *
 * `low` and `high` used to be the same red, because when this was written the
 * palette was a single sky hue plus `destructive` and there was nothing else to
 * reach for. That is no longer true, and rendering clinically opposite findings
 * in one colour was the reason Wave 1 had to patch in an icon at all.
 *
 * They now take the two ends of the diverging ramp — cool for below range, warm
 * for above — which is what that ramp exists for: `low ← normal → high` is
 * textbook diverging data, so direction and magnitude ride on one scale. Both
 * ends are checked against the surface and against each other under dichromacy
 * by scripts/check-tokens.mjs, so this is validated rather than eyeballed.
 */
export const STATUS_STYLES: Record<EhrStatus, { text: string; border: string }> = {
  low: {
    text: "text-chart-div-1",
    border: "border-chart-div-1/40 bg-chart-div-1/5",
  },
  high: {
    text: "text-chart-div-5",
    border: "border-chart-div-5/40 bg-chart-div-5/5",
  },
  // In range is a finding too, not the absence of one — muted grey read as
  // "not yet measured", which `unknown` already means.
  normal: { text: "text-success", border: "border-success/40 bg-success/5" },
  unknown: { text: "text-muted-foreground", border: "border-border border-dashed" },
};

export const StatusIcon = ({
  status,
  className,
}: {
  status: EhrStatus;
  className?: string;
}) => {
  const Icon =
    status === "high"
      ? ArrowUp
      : status === "low"
      ? ArrowDown
      : status === "normal"
      ? Check
      : Minus;
  return (
    <Icon
      aria-hidden="true"
      className={cn("h-3.5 w-3.5 shrink-0", STATUS_STYLES[status].text, className)}
    />
  );
};
