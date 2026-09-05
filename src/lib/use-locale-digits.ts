"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { localeDigits } from "./utils";

/**
 * A digit formatter bound to the active locale.
 *
 * Eighty-eight call sites reached for `digitsEnToFa` directly — chart ticks,
 * tooltips, table cells, a couple of controlled inputs — which renders Persian
 * numerals unconditionally, including to a reader who has chosen English. That
 * is not a Persian-first decision; it is the absence of one, since `/fa` and
 * `/en` produce identical digits either way.
 *
 * Returned memoised so it can be passed straight to recharts' `tickFormatter`
 * and `formatter` without giving them a new function identity every render.
 * The extra arguments recharts passes (index, payload) are ignored by design.
 */
export const useLocaleDigits = (): ((value: unknown) => string) => {
  const locale = useLocale();
  return React.useCallback(
    (value: unknown) => localeDigits(String(value ?? ""), locale),
    [locale]
  );
};
