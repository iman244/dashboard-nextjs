/**
 * Which way the interface reads.
 *
 * This existed as `locale === "fa"` copied into sixteen components. Three of
 * those copies had already drifted — one compared against the wrong value, two
 * picked the wrong side for a popover — which is what a duplicated one-liner
 * does over time. It is one rule, so it lives in one place, and adding a second
 * RTL locale is a change to `RTL_LOCALES` rather than a search across the tree.
 *
 * No "use client" here on purpose: the root layout and the locale layout both
 * resolve the locale on the server and need these. The hook forms live in
 * `use-direction.ts`, which is a client module.
 */

export type Direction = "rtl" | "ltr";

const RTL_LOCALES = new Set(["fa"]);

export const isRtlLocale = (locale: string): boolean => RTL_LOCALES.has(locale);

export const directionOf = (locale: string): Direction =>
  isRtlLocale(locale) ? "rtl" : "ltr";

/**
 * Vazirmatn for Persian, Geist for Latin. The two faces have different metrics,
 * so this is a font *stack* swap rather than a `lang` hint.
 */
export const fontClassOf = (locale: string): string =>
  isRtlLocale(locale) ? "font-persian" : "font-english";
