/**
 * Shared recharts presentation constants.
 *
 * Tick labels are sized in `rem`, not px. Recharts renders SVG `<text>`, and a
 * bare number (`fontSize={12}`) becomes a px value that ignores the browser's
 * text-size setting; `0.75rem` scales with the root font size, so a user who
 * enlarges text gets larger axis labels too (WCAG 1.4.4).
 */
export const CHART_TICK_FONT_SIZE = "0.75rem";

/** Denser variant, for axes whose labels are long enough to collide at the default size. */
export const CHART_TICK_FONT_SIZE_SM = "0.625rem";
