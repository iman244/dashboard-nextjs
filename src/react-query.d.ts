import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /** Skip the global "Network error" dialog; the caller shows the failure inline. */
      silentNetworkError?: boolean;
    };
    mutationMeta: {
      /** Skip the global "Network error" dialog; the caller shows the failure itself. */
      silentNetworkError?: boolean;
    };
  }
}
