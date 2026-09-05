import { LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Decoration, deliberately.
 *
 * This used to carry `role="status"` and a hardcoded `aria-label="Loading"`,
 * which had two costs: on a Persian-first product it was the only thing a
 * Persian screen-reader user heard during every wait, and because every spinner
 * was its own live region, a screen with several announced "Loading" several
 * times.
 *
 * The accessible name belongs to whatever explains the wait — `LoadingState`,
 * a submit button's label, a table's `aria-busy` — so the icon says nothing and
 * gets out of the way. Pass `aria-hidden={false}` with your own label only if a
 * spinner ever has to stand entirely alone.
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
