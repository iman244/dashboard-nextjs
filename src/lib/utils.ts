import { digitsEnToFa, digitsFaToEn } from "@persian-tools/persian-tools";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const localeDigits = (value: string, locale: string) => {
  return locale === "fa" ? digitsEnToFa(value) : digitsFaToEn(value);
};