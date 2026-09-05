import * as React from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * The one way this app says "working on it".
 *
 * There were eight route-level pending states and they agreed on nothing: three
 * spellings of the spinner size (`size-8`, `h-8 w-8`, bare), four container
 * heights, and half of them showed no text at all — so the reader was told
 * something was happening but never what. This is the shape they all take now.
 *
 * `label` is passed in rather than translated here, because this renders both
 * inside the locale tree and in the root route boundary that sits above
 * `NextIntlClientProvider`, where a translation hook would throw.
 *
 * Accessibility: the spinner is decoration and the text is the label. The
 * container is the live region, so a reader hears "Loading records" once — not
 * one bare "Loading" per spinner on screen, which is what a `role="status"` on
 * every icon produced.
 */
export function LoadingState({
  label,
  size = "page",
  className,
}: {
  /** What is loading. Omit only where no translation is reachable. */
  label?: string;
  /** `page` fills a route body; `inline` sits inside a card or a column. */
  size?: "page" | "inline";
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        size === "page" ? "min-h-[400px] p-8" : "p-6",
        className
      )}
    >
      <Spinner className={size === "page" ? "size-8" : "size-5"} />
      {label && (
        <span className="max-w-[36ch] text-sm text-muted-foreground text-pretty">
          {label}
        </span>
      )}
    </div>
  );
}
