import React from "react";
import { ArrowDown, ArrowUp, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EhrStatus } from "./classify";

/**
 * Status is carried by icon *and* colour, never colour alone — the palette is
 * a single sky hue plus destructive, so a red/green pairing would collapse for
 * a deuteranopic reader.
 */
export const STATUS_STYLES: Record<EhrStatus, { text: string; border: string }> = {
  low: { text: "text-destructive", border: "border-destructive/40 bg-destructive/5" },
  high: { text: "text-destructive", border: "border-destructive/40 bg-destructive/5" },
  normal: { text: "text-muted-foreground", border: "border-border" },
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
