"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * What the interface is set to now, for a trigger that wants to say so.
 *
 * "System" stays "system" rather than resolving to the light or dark it
 * currently produces: the user chose to follow the machine, and reporting
 * "dark" back to them would hide that choice.
 */
export function useThemeLabel() {
  const { resolvedTheme, theme } = useTheme()
  const t = useTranslations("common.Theme")

  return React.useMemo(() => {
    const current = theme === "system" ? "system" : resolvedTheme
    if (current === "light") return t("light")
    if (current === "dark") return t("dark")
    return t("system")
  }, [resolvedTheme, theme, t])
}

/**
 * The theme choices, for a menu that already has a trigger of its own.
 *
 * Radio items rather than plain items with a hand-drawn check: this is one
 * choice out of three, so `role="menuitemradio"` lets a screen reader announce
 * which is current instead of leaving the mark purely visual.
 */
export function ThemeMenuItems() {
  const { setTheme, theme } = useTheme()
  const t = useTranslations("common.Theme")

  return (
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      <DropdownMenuRadioItem value="light">{t("light")}</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">{t("dark")}</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">{t("system")}</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  )
}

/**
 * The standalone control, for surfaces with no account menu to put it in.
 * Inside the console's profile menu the same choices appear as a submenu.
 */
export function DarkModeToggle() {
  const t = useTranslations("common.Theme")
  const themeLabel = useThemeLabel()

  return (
    <DropdownMenu>
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
      <DropdownMenuContent align="end">
        <ThemeMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
