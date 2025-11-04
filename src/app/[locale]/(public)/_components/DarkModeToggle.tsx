"use client"

import * as React from "react"
import { Check, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function DarkModeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme()
  const t = useTranslations("Theme")
  const locale = useLocale()
  const isRTL = locale === "fa"

  const themeLabel = React.useMemo(() => {
    const current = theme === "system" ? "system" : resolvedTheme
    if (current === "light") return t("light")
    if (current === "dark") return t("dark")
    return t("system")
  }, [resolvedTheme, theme, t])

  return (
    <DropdownMenu dir={isRTL ? "rtl" : "ltr"}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={t("toggle")}>
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">{t("toggle")}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>{t("current", { theme: themeLabel })}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align={isRTL ? "start" : "end"}>
        <DropdownMenuItem onClick={() => setTheme("light")}
          className="flex items-center gap-2">
          <span className="inline-flex size-3 items-center justify-center">
            {resolvedTheme === "light" && theme !== "system" ? (
              <Check className="h-3 w-3" />
            ) : null}
          </span>
          {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2">
          <span className="inline-flex size-3 items-center justify-center">
            {resolvedTheme === "dark" && theme !== "system" ? (
              <Check className="h-3 w-3" />
            ) : null}
          </span>
          {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2">
          <span className="inline-flex size-3 items-center justify-center">
            {theme === "system" ? <Check className="h-3 w-3" /> : null}
          </span>
          {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
