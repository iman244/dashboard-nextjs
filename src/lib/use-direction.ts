"use client";

import { useLocale } from "next-intl";
import { directionOf, isRtlLocale, type Direction } from "./direction";

/**
 * Reading direction for the active locale.
 *
 * Prefer logical CSS (`ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`, `text-start`)
 * over branching on this: the stylesheet already knows the direction from
 * `<html dir>`, so most components need no hook at all. Reach for these two only
 * where a *value* depends on direction and CSS cannot express it — a Radix
 * `side` prop, an icon that must mirror, a chart axis orientation.
 */
export const useDirection = (): Direction => directionOf(useLocale());

export const useIsRtl = (): boolean => isRtlLocale(useLocale());
