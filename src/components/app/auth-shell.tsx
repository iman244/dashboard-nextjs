"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DarkModeToggle } from "@/components/app/theme-toggle";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The sign-in world, in one place.
 *
 * The product has two sign-in screens — staff and patient — and they were two
 * different products to look at: one had concentric radii, an ambient ground and
 * a pill submit, the other was a stock shadcn card. Sharing the shell is the only
 * thing that keeps them from drifting apart again the next time one is touched.
 *
 * `dir` is set on the element rather than inherited so the shell is correct even
 * if it is ever rendered above the locale layout.
 */
export function AuthShell({
  dir,
  eyebrow,
  title,
  description,
  children,
}: {
  dir: "rtl" | "ltr";
  /** Small caps label above the title. Stands in as the a11y description when
   *  there is no `description`, so the card is never left without one. */
  eyebrow: string;
  title: string;
  /** Optional supporting sentence under the title. The patient sign-in needs one
   *  (it has to say what the national id is for); the staff sign-in does not. */
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className="relative min-h-dvh flex items-center justify-center overflow-hidden px-4 py-24"
      dir={dir}
    >
      {/* Ambient ground: two very low-chroma orbs, no hard edges. Fixed and
          pointer-events-none so they never repaint with scrolling content. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          // Both orbs stay in the brand hue family. An earlier version used
          // --chart-7, which is a saturated cyan in dark mode and cast the whole
          // lower corner green.
          background:
            "radial-gradient(60rem 40rem at 18% 8%, color-mix(in oklab, var(--primary) 9%, transparent), transparent 65%)," +
            "radial-gradient(48rem 34rem at 84% 92%, color-mix(in oklab, var(--chart-5) 6%, transparent), transparent 62%)",
        }}
      />

      {/* Theme control sits in the page corner, clear of the card, so it reads as
          chrome rather than part of the sign-in form. */}
      <div className="absolute end-4 top-4 z-10">
        <DarkModeToggle />
      </div>

      {/* Double-bezel: an outer tray holding an inner plate, with concentric radii. */}
      <div className="w-full max-w-[26rem] rounded-[2rem] bg-foreground/[0.035] p-1.5 ring-1 ring-foreground/[0.07] backdrop-blur-sm">
        {/* gap-0 py-0 disables Card's own rhythm so spacing is set once, here,
            rather than stacking three systems on top of each other. */}
        <Card className="gap-0 rounded-[1.625rem] border-0 bg-card py-0 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-12px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_16px_40px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <CardHeader className="gap-0 px-7 pb-0 pt-10">
            <span className="mx-auto mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </span>
            <CardTitle className="text-center! text-[1.75rem] font-bold leading-[1.15] tracking-[-0.02em]">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="mx-auto mt-3 max-w-[32ch] text-center! text-sm leading-relaxed text-balance">
                {description}
              </CardDescription>
            ) : (
              <CardDescription className="sr-only">{eyebrow}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="px-7 pb-10 pt-8">{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}

/**
 * The pill submit, with one trailing slot whose contents swap between an arrow
 * and a spinner.
 *
 * The single slot is the point: an earlier version rendered the spinner on the
 * leading side while the arrow sat trailing, so the label jumped sideways the
 * moment you clicked — ux-guidelines #19, keep async states in a stable
 * container.
 *
 * `busy` must stay true through the navigation that follows a successful submit,
 * not just while the request is in flight. Neither sign-in shows an interstitial
 * any more, so this button is what the user watches while the next page loads;
 * on `isPending` alone it would snap back to its idle label and sit there looking
 * clickable.
 */
export function AuthSubmitButton({
  busy,
  idleLabel,
  busyLabel,
  className,
}: {
  busy: boolean;
  idleLabel: string;
  busyLabel: string;
  className?: string;
}) {
  return (
    <Button
      type="submit"
      disabled={busy}
      className={cn(
        "group mt-7 h-12 w-full rounded-full text-[15px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.10),0_8px_20px_-8px_color-mix(in_oklab,var(--primary)_55%,transparent)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.12),0_12px_28px_-8px_color-mix(in_oklab,var(--primary)_65%,transparent)] active:scale-[0.985]",
        className
      )}
    >
      <span className="flex w-full items-center justify-center gap-3">
        {busy ? busyLabel : idleLabel}
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5"
        >
          {busy ? (
            <Spinner className="size-3.5" />
          ) : (
            <svg
              viewBox="0 0 16 16"
              fill="none"
              className="size-3.5 rtl:rotate-180"
            >
              <path
                d="M2.5 8h10M9 4.5 12.5 8 9 11.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </span>
    </Button>
  );
}
