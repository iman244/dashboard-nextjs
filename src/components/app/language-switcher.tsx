"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * A language's name is always written in that language, never translated.
 *
 * The person who needs this control is the one who cannot read the interface
 * in front of them, so the label has to be legible from outside the current
 * locale: someone stuck in Persian reads "English", someone stuck in English
 * reads "فارسی". Localising these — "انگلیسی" in the Persian bundle — would
 * fail precisely the user the control exists for, which is why they are
 * constants here instead of message keys.
 */
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  fa: "فارسی",
};

export const localeName = (locale: string): string =>
  LOCALE_NAMES[locale] ?? locale;

/** Every configured locale, so a third would appear without touching the UI. */
const LOCALES = routing.locales as readonly string[];

/**
 * The switch itself, shared by the button and the profile menu so the two can
 * never drift on the part that is easy to get wrong.
 */
const useLocaleSwitcher = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const [isSwitching, setIsSwitching] = React.useState(false);

  const switchTo = React.useCallback(
    (next: string) => {
      if (next === locale) return;

      // Read the query string here rather than through `useSearchParams`,
      // which would force every statically rendered page hosting this — the
      // landing page among them — behind a Suspense boundary. This only ever
      // runs from a click, so `location` is safe and filters and date ranges
      // survive the switch.
      const search = window.location.search;
      setIsSwitching(true);

      // A full document load, deliberately, and not the next-intl router.
      //
      // `<html lang>`, `<html dir>` and the Radix `Direction.Provider` are all
      // set in the *root* layout, which sits above the `[locale]` segment. The
      // App Router never re-renders a root layout during a client-side
      // navigation, so a soft switch leaves the document at `lang="fa"
      // dir="rtl"` while the content underneath turns English — Latin text
      // laid out right-to-left, with every dropdown opening off the wrong
      // edge.
      //
      // Reaching into `document.documentElement` from an effect would mean
      // hand-maintaining a mirror of what the root layout computes, and could
      // not reach the Radix provider at all, since that is React context. A
      // document load re-renders the whole tree on the server under the new
      // locale instead, which is correct by construction. Changing language is
      // a deliberate, once-a-session act, so the reload is worth its cost.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the rule's advice is right in general and wrong here: a soft navigation is exactly what must not happen, for the reason above.
      window.location.href = `${getPathname({ href: pathname, locale: next })}${search}`;
    },
    [locale, pathname]
  );

  return { locale, isSwitching, switchTo };
};

/**
 * The locale choices, for a menu that already has a trigger of its own.
 *
 * Radio items rather than plain items with a drawn check: this is one choice
 * out of a set, so `role="menuitemradio"` lets a screen reader announce which
 * one is current instead of leaving the mark purely visual.
 */
export function LanguageMenuItems() {
  const { locale, switchTo } = useLocaleSwitcher();

  return (
    <DropdownMenuRadioGroup value={locale} onValueChange={switchTo}>
      {LOCALES.map((l) => (
        // `lang` on each row: the text is in that language, so assistive tech
        // switches voice and the browser picks the right font for the run.
        <DropdownMenuRadioItem key={l} value={l} lang={l}>
          {localeName(l)}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

/**
 * The standalone control, for surfaces with no account menu to put it in —
 * the landing page, where it sits beside `DarkModeToggle` because both are
 * viewing preferences and the corner users scan for one is where they look for
 * the other.
 *
 * With two locales this is a direct toggle whose label names its destination:
 * one click, and the visible text answers "what happens if I press this"
 * without opening anything. Inside the console's profile menu the same choice
 * is a submenu instead — there it can show which locale is current, which a
 * bare button cannot.
 */
export function LanguageSwitcher() {
  const { locale, isSwitching, switchTo } = useLocaleSwitcher();
  const t = useTranslations("common.Language");

  // The next locale in the ring. With two configured that is simply "the other
  // one"; a third would keep cycling rather than break, though by then this
  // surface would want the menu form too.
  const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];
  const nextName = localeName(next);
  const label = t("switchTo", { language: nextName });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          // Default size, not `sm`: this sits beside `DarkModeToggle`, whose
          // icon button is 36px square. At `sm` (32px) the pair was visibly
          // ragged along both edges.
          size="default"
          onClick={() => switchTo(next)}
          disabled={isSwitching}
          // Contains the visible text, so voice control still matches on the
          // word the user can see (WCAG 2.5.3).
          aria-label={label}
        >
          <Languages aria-hidden="true" className="h-4 w-4" />
          <span lang={next}>{nextName}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}
