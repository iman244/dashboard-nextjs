import React from "react";

import { LoadingState } from "@/components/app/loading-state";

/**
 * The root route's Suspense fallback.
 *
 * No label, deliberately: this sits above `NextIntlClientProvider`, so no
 * translation is reachable here and an English string would be the one thing a
 * Persian reader hears. A silent status region is the honest version — the
 * route-level states below it, which can translate, say what is loading.
 */
const Loading = () => (
  <div className="min-h-dvh bg-background flex items-center justify-center">
    <LoadingState />
  </div>
);

export default Loading;
